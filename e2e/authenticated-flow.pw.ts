import { test, expect, type Page } from "@playwright/test";

const password = "gridmind-ci-password"; // Synthetic, ephemeral local users only.
const functionPath = "/functions/v1/persist-factory-analysis";

test.beforeEach(async ({ page }) => {
  page.on("pageerror", (error) => console.error("Browser exception:", error.message));
  page.on("response", async (response) => {
    const url = new URL(response.url());
    if (url.hostname === "127.0.0.1" && response.status() >= 400) {
      console.error("Local request failed:", response.status(), url.pathname);
      if (url.pathname.startsWith("/rest/v1/")) {
        const body = await response.json().catch(() => ({}));
        console.error("Database error:", body.code, body.message);
      }
    }
  });
});

test.afterEach(async ({ page }, info) => {
  if (info.status !== info.expectedStatus) {
    // Only synthetic local fixture content; no cookies, passwords or tokens.
    console.error("Browser visible state:", (await page.locator("body").innerText()).slice(0, 5000));
  }
});

async function signIn(page: Page, user: "a" | "b") {
  await page.goto("/auth");
  await page.getByLabel("Email", { exact: true }).fill(`gridmind-http-${user}@example.test`);
  await page.getByLabel("Password", { exact: true }).fill(password);
  const authResponse = page.waitForResponse((response) => response.url().includes("/auth/v1/token") && response.request().method() === "POST", { timeout: 15_000 });
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  expect((await authResponse).status()).toBe(200);
  await expect(page.getByRole("button", { name: "Sign out", exact: true })).toBeVisible();
  await expect(page.getByRole("combobox")).toContainText(`gridmind-http-factory-${user}`);
}

// Verify stored state using the signed-in browser's own JWT, never an admin key.
// Tokens remain inside the browser and are not returned in test evidence.
async function browserApi(page: Page, path: string, body?: Record<string, unknown>) {
  return page.evaluate(async ({ path, body, key }) => {
    const storageKey = Object.keys(localStorage).find((name) => /^sb-.*-auth-token$/.test(name));
    const session = storageKey ? JSON.parse(localStorage.getItem(storageKey) ?? "null") : null;
    if (!session?.access_token) throw new Error("Browser has no authenticated session.");
    const response = await fetch(`http://127.0.0.1:54321${path}`, {
      method: body ? "POST" : "GET",
      headers: { apikey: key!, Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json", Prefer: "return=representation" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, body: await response.json() };
  }, { path, body, key: process.env.SUPABASE_ANON_KEY });
}

test("sign-in, authoritative save, lost-response retry, refresh and re-login preserve the stored analysis", async ({ page }) => {
  await signIn(page, "a");
  await page.goto("/machines");
  const assetLink = page.getByRole("link", { name: "gridmind-http-asset-a", exact: true });
  const assetPath = await assetLink.getAttribute("href");
  expect(assetPath).toMatch(/^\/machines\/\d+$/);
  await assetLink.click();
  await expect(page.getByRole("heading", { name: "gridmind-http-asset-a", exact: true })).toBeVisible();

  let committed: { id: number; factory_id: number; idempotency_key: string } | undefined;
  let persistedRequests = 0;
  await page.route(`**${functionPath}`, async (route) => {
    if (route.request().method() !== "POST" || route.request().postDataJSON()?.action !== "persist") {
      await route.continue();
      return;
    }
    persistedRequests += 1;
    if (persistedRequests === 1) {
      // The real server commits successfully; only delivery to the browser fails.
      const response = await route.fetch();
      expect(response.ok()).toBeTruthy();
      committed = (await response.json()).run;
      await route.abort("failed");
      return;
    }
    expect(route.request().postDataJSON().idempotencyKey).toBe(committed!.idempotency_key);
    await route.continue();
  });
  await page.getByRole("button", { name: "Run and verify", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("persist failed");
  await expect(page.getByText("Reload verified", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Retry same analysis", exact: true }).click();
  await expect(page.getByText("Reload verified", { exact: true })).toBeVisible();
  await expect(page.getByText(/Estimated net value: INR 1,500/)).toBeVisible();
  await expect(page.getByText(/Source observation IDs:/)).toContainText(`Run ID: ${committed!.id}`);
  expect(persistedRequests).toBe(2);
  await page.unroute(`**${functionPath}`);

  for (const reauthenticate of [false, true]) {
    if (reauthenticate) {
      await page.getByRole("button", { name: "Sign out", exact: true }).click();
      await expect(page.getByRole("button", { name: "Sign out", exact: true })).toHaveCount(0);
      await signIn(page, "a");
      await page.goto(assetPath!);
    } else {
      await page.reload();
    }
    await expect(page.getByRole("heading", { name: "gridmind-http-asset-a", exact: true })).toBeVisible();
    const verified = await browserApi(page, functionPath, {
      action: "verify", factoryId: committed!.factory_id, idempotencyKey: committed!.idempotency_key,
    });
    expect(verified.status).toBe(200);
    expect(verified.body.reproducible).toBe(true);
    expect(verified.body.stored.id).toBe(committed!.id);
    expect(verified.body.recomputed.economics.estimatedNetValueInr).toBe(1500);
    expect(verified.body.recomputed.provenance.inputObservationIds).toHaveLength(15);
  }
});

test("non-empty persisted opportunity values preserve currency, null, zero and status after refresh", async ({ page }) => {
  await signIn(page, "a");
  const factories = await browserApi(page, "/rest/v1/factories?select=id,name");
  const title = `Synthetic browser opportunity ${crypto.randomUUID()}`;
  const created = await browserApi(page, "/rest/v1/opportunities", {
    factory_id: factories.body[0].id, scope_type: "factory", title,
    currency: "USD", recoverable_opportunity: 1234.5, expected_recovery: 1200,
    expected_net_value: 0, intervention_cost: 0, gross_loss: null,
    status: "not_material", measurement_confidence: 0.75,
  });
  expect(created.status).toBe(201);
  await page.goto("/opportunities");
  for (const refresh of [false, true]) {
    if (refresh) await page.reload();
    const card = page.getByRole("article").filter({ has: page.getByRole("heading", { name: title, exact: true }) });
    await expect(card).toBeVisible();
    await expect(card.getByRole("combobox")).toHaveText("not material");
    await expect(card).toContainText("1,234.50 USD");
    await expect(card).toContainText("0.00 USD");
    await expect(card).toContainText("Gross loss: —");
    await expect(card).toContainText("measurement 0.75");
    await expect(card).not.toContainText("₹");
  }
});

test("asset read failures are visible and a recovered connection can reload real data", async ({ page }) => {
  await signIn(page, "a");
  await page.route("**/rest/v1/factory_assets?**", async (route) => {
    // Fail only the asset page's scoped query, not initial snapshot loading.
    const scope = new URL(route.request().url()).searchParams.get("factory_id");
    if (scope?.startsWith("eq.")) {
      await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ message: "Synthetic asset read failure" }) });
    } else {
      await route.continue();
    }
  });
  await page.goto("/machines");
  await expect(page.getByText("Could not load assets: Synthetic asset read failure", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "gridmind-http-asset-a", exact: true })).toHaveCount(0);
  await page.unroute("**/rest/v1/factory_assets?**");
  await page.reload();
  await expect(page.getByRole("link", { name: "gridmind-http-asset-a", exact: true })).toBeVisible();
});

test("separate authenticated users cannot read or analyze each other's populated assets", async ({ page, browser }) => {
  await signIn(page, "a");
  await page.goto("/machines");
  const assetPath = await page.getByRole("link", { name: "gridmind-http-asset-a", exact: true }).getAttribute("href");
  const factoriesA = await browserApi(page, "/rest/v1/factories?select=id,name");
  expect(factoriesA.status).toBe(200);
  expect(factoriesA.body).toHaveLength(1);
  const contextB = await browser.newContext({ baseURL: "http://127.0.0.1:4173" });
  try {
    const pageB = await contextB.newPage();
    await signIn(pageB, "b");
    await pageB.goto("/machines");
    await expect(pageB.getByRole("link", { name: "gridmind-http-asset-b", exact: true })).toBeVisible();
    await expect(pageB.getByRole("link", { name: "gridmind-http-asset-a", exact: true })).toHaveCount(0);
    await pageB.goto(assetPath!);
    await expect(pageB.getByText("Asset not found.", { exact: false })).toBeVisible();
    const foreignAssets = await browserApi(pageB, `/rest/v1/factory_assets?factory_id=eq.${factoriesA.body[0].id}&select=id,name`);
    expect(foreignAssets.status).toBe(200);
    expect(foreignAssets.body).toEqual([]);
    const denied = await browserApi(pageB, functionPath, {
      action: "persist", factoryId: factoriesA.body[0].id,
      assetId: Number(assetPath!.split("/").at(-1)), idempotencyKey: "browser-cross-tenant-denied",
    });
    expect(denied.status).toBe(403);
  } finally {
    await contextB.close();
  }
});
