import { test, expect } from "@playwright/test";
import { inputSchema } from "../src/lib/industrial-core/model";

test.beforeEach(async ({ context }) => {
  await context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    return url.protocol.startsWith("http") && url.hostname !== "127.0.0.1"
      ? route.abort()
      : route.continue();
  });
});
test("customer walkthrough evaluates all scenarios and downloads the exact server data", async ({
  page,
}) => {
  const errors: string[] = [];
  const backendRequests: string[] = [];
  page.on("request", (r) => {
    if (/\/(auth|rest|storage)\/v1\//.test(new URL(r.url()).pathname))
      backendRequests.push(new URL(r.url()).pathname);
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/customer-demo");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("factory records");
  for (const scenario of ["A", "B", "C", "D"]) {
    await page.getByLabel("Customer sample scenario").selectOption(scenario);
    const pending = page.waitForResponse(
      (r) => r.url().endsWith("/api/industrial-core") && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Run customer sample", exact: true }).click();
    const response = await pending;
    expect(response.status()).toBe(200);
    const sample = await response.json();
    expect(JSON.parse(response.request().postData()!)).toEqual({
      action: "customer_demo",
      scenario,
    });
    await expect(
      page.getByRole("heading", { name: sample.story.title, exact: true }),
    ).toBeVisible();
    if (scenario === "A") {
      await expect(page.getByText("150 kg = 200 − 50 reserved", { exact: true })).toBeVisible();
      const download = page.waitForEvent("download");
      await page.getByRole("button", { name: "Download sample data and decision" }).click();
      const file = await download;
      expect(file.suggestedFilename()).toBe("gridmind-customer-demo-A-SYNTHETIC.json");
      const chunks: Buffer[] = [];
      for await (const chunk of (await file.createReadStream())!) chunks.push(Buffer.from(chunk));
      const exported = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      expect(exported).toEqual(sample);
      expect(inputSchema.safeParse(exported.input).success).toBe(true);
      if (process.env.GRIDMIND_DEMO_SCREENSHOT_DIR)
        await page.screenshot({
          path: `${process.env.GRIDMIND_DEMO_SCREENSHOT_DIR}/customer-demo-desktop.png`,
          fullPage: true,
        });
    }
    if (scenario === "B")
      await expect(page.getByText("Qualification is incomplete", { exact: false })).toBeVisible();
    if (scenario === "C") await expect(page.getByText(/The press is unavailable/)).toBeVisible();
    if (scenario === "D")
      await expect(page.getByText(/A lower price cannot waive it/)).toBeVisible();
    expect(sample.workflow.execution).toBe("not_executed");
    await expect(
      page.getByText("Unverified. No measured improvement or verified savings.", { exact: true }),
    ).toBeVisible();
  }
  expect(errors).toEqual([]);
  expect(backendRequests).toEqual([]);
});
test("mobile sample handles a failed request and a fresh retry without stale decisions", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/customer-demo");
  let failOnce = true;
  await page.route("**/api/industrial-core", async (route) => {
    if (failOnce) {
      failOnce = false;
      return route.fulfill({
        status: 503,
        contentType: "application/json",
        body: '{"error":"TEST_OUTAGE"}',
      });
    }
    return route.continue();
  });
  await page.getByRole("button", { name: "Run customer sample", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Please try again");
  await expect(
    page.getByRole("button", { name: "Download sample data and decision" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Run customer sample", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Can we accept this component order?" }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (process.env.GRIDMIND_DEMO_SCREENSHOT_DIR)
    await page.screenshot({
      path: `${process.env.GRIDMIND_DEMO_SCREENSHOT_DIR}/customer-demo-mobile.png`,
      fullPage: true,
    });
  await page.getByLabel("Customer sample scenario").selectOption("D");
  await expect(
    page.getByRole("heading", { name: "Can we accept this component order?" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Download sample data and decision" }),
  ).toBeDisabled();
});
