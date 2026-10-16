import { chromium, expect } from "@playwright/test";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

/** Production browser -> real command processor -> disposable PostgreSQL.
 * Auth and PostgREST transports are fixtures, NOT live Supabase acceptance.
 * Run through verification/postgres-acceptance.ts; never takes a remote DB URL.
 */
export async function verifyConnectedBrowser(
  execute: (command: unknown) => Promise<unknown>,
  factoryId: number,
) {
  const base = "http://127.0.0.1:4187";
  const server = spawn(
    "bun",
    [
      "run",
      "preview",
      "--",
      "--ip",
      "127.0.0.1",
      "--port",
      "4187",
      "--show-interactive-dev-session=false",
    ],
    {
      cwd: new URL("../", import.meta.url).pathname,
      env: {
        ...process.env,
        WRANGLER_SEND_METRICS: "false",
        GRIDMIND_CONNECTED_CASES_ENABLED: "disabled",
      },
      stdio: "ignore",
    },
  );
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  try {
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try {
        ready = (await fetch(`${base}/investigations-connected`)).ok;
      } catch {
        /* starting */
      }
      if (ready) break;
      if (server.exitCode !== null) throw new Error("Production fixture preview exited");
      await delay(250);
    }
    if (!ready) throw new Error("Production fixture preview did not start");
    const disabled = await fetch(`${base}/api/investigations`, { method: "POST", body: "{}" });
    expect(disabled.status).toBe(503);
    expect(await disabled.json()).toEqual({ error: "CONNECTED_CASES_DISABLED" });
    browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await context.route("**/*", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.pathname === "/api/investigations") {
        expect(request.headers().authorization).toBe("Bearer synthetic-browser-token");
        try {
          await route.fulfill({ json: await execute(request.postDataJSON()) });
        } catch (e) {
          await route.fulfill({
            status: 400,
            json: { error: e instanceof Error ? e.message : "Fixture command failed" },
          });
        }
        return;
      }
      if (url.pathname === "/auth/v1/token") {
        await route.fulfill({
          json: {
            access_token: "synthetic-browser-token",
            refresh_token: "synthetic-browser-refresh",
            token_type: "bearer",
            expires_in: 3600,
            user: {
              id: "11111111-1111-4111-8111-111111111111",
              email: "case-owner@example.test",
              aud: "authenticated",
              role: "authenticated",
              app_metadata: {},
              user_metadata: {},
              created_at: "2026-10-16T00:00:00Z",
            },
          },
        });
        return;
      }
      if (url.pathname === "/rest/v1/factories") {
        await route.fulfill({ json: [{ id: factoryId, name: "CASE-SYN-A" }] });
        return;
      }
      if (/^\/(auth|rest)\/v1/.test(url.pathname)) {
        await route.fulfill({ json: {} });
        return;
      }
      if (url.hostname !== "127.0.0.1" && url.protocol.startsWith("http")) {
        await route.abort();
        return;
      }
      await route.continue();
    });
    await page.goto(`${base}/investigations-connected`);
    await expect(page.getByRole("heading", { name: "Persisted investigations" })).toBeVisible();
    await page.getByLabel("Email", { exact: true }).fill("case-owner@example.test");
    await page.getByLabel("Password", { exact: true }).fill("synthetic-fixture-only");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("button", { name: "Create synthetic case" })).toBeEnabled();
    await page.getByRole("button", { name: "Create synthetic case" }).click();
    await expect(page.getByText("Revision 1", { exact: true })).toBeVisible();
    await page
      .getByLabel("Correction reason")
      .fill("Browser verifies an invented question correction");
    await page
      .getByLabel("Decision question", { exact: true })
      .fill("Persist this invented question through PostgreSQL");
    await page.getByRole("button", { name: "Save revision", exact: true }).click();
    await expect(page.getByText("Revision 2", { exact: true })).toBeVisible();
    await page.reload();
    await page.getByRole("button", { name: "Load my cases" }).click();
    await page.getByRole("button", { name: /· v2 · manager$/ }).click();
    await expect(page.getByLabel("Decision question", { exact: true })).toHaveValue(
      "Persist this invented question through PostgreSQL",
    );
    await page.getByRole("button", { name: "Evidence", exact: true }).click();
    const source = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: /^E01 ·/ }) });
    await source
      .getByLabel("Source checks and verification basis")
      .fill("Invented bill checked against the synthetic source register");
    await source.getByRole("button", { name: "Record source verification" }).click();
    await expect(page.getByText("Revision 3", { exact: true })).toBeVisible();
    await expect(page.getByText(/Verified for this synthetic method by 11111111/)).toBeVisible();
    await page.getByRole("button", { name: "History", exact: true }).click();
    await page.getByRole("button", { name: "Open revision 1", exact: true }).click();
    await expect(
      page.getByText("Historical revision — editing disabled. Load the latest case to continue."),
    ).toBeVisible();
    await page.getByRole("button", { name: "Brief", exact: true }).click();
    await expect(page.locator("pre")).toContainText("Customer release:** BLOCKED");
    await expect(page.locator("pre")).not.toContainText(
      "Persist this invented question through PostgreSQL",
    );
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export persisted Decision Brief" }).click();
    expect((await download).suggestedFilename()).toMatch(/-v1-SYNTHETIC\.md$/);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(
      await page.evaluate(() => localStorage.getItem("gridmind:synthetic-investigations:v1")),
    ).toBeNull();
    expect(errors).toEqual([]);
    console.log(
      "PASS production browser → command processor → PostgreSQL create/save/reload/verify/history/export; fixture Auth/PostgREST; default-disabled API",
    );
  } finally {
    await browser?.close();
    server.kill("SIGTERM");
    await Promise.race([new Promise((resolve) => server.once("exit", resolve)), delay(2000)]);
    if (server.exitCode === null) server.kill("SIGKILL");
  }
}
