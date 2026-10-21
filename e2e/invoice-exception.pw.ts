import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test.beforeEach(async ({ context }) => {
  await context.route("**/*", (route) => {
    const u = new URL(route.request().url());
    return u.protocol.startsWith("http") && u.hostname !== "127.0.0.1"
      ? route.abort()
      : route.continue();
  });
});
test("invoice evidence → review → action → inconclusive follow-up → source-preserving export", async ({
  page,
}) => {
  const errors: string[] = [],
    backend: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (/supabase|\/rest\/v1|\/functions\/v1/.test(r.url())) backend.push(r.url());
  });
  await page.goto("/investigations");
  const panel = page.getByRole("region", { name: "Reconcile one invoice exception." });
  await panel.getByRole("button", { name: "Load quantity difference" }).click();
  await expect(panel.getByText(/Assessment:.*documentary exception/)).toBeVisible();
  await expect(panel.getByText(/unpaid status/)).toBeVisible();
  await expect(
    panel.getByRole("button", { name: "Record fictional authorised action" }),
  ).toBeDisabled();
  await panel.getByRole("button", { name: "Record invoice simulated review" }).click();
  await expect(
    panel.getByRole("button", { name: "Record fictional authorised action" }),
  ).toBeEnabled();
  await panel.getByRole("button", { name: "Record fictional authorised action" }).click();
  await panel.getByRole("button", { name: "Record inconclusive follow-up" }).click();
  await expect(panel.getByText(/follow-up: inconclusive/)).toBeVisible();
  const downloading = page.waitForEvent("download");
  await panel.getByRole("button", { name: "Export synthetic evidence report" }).click();
  const download = await downloading;
  const path = await download.path();
  const report = JSON.parse(await readFile(path!, "utf8"));
  expect(report.state.dataset.rawCsv).toContain("record_id,kind");
  expect(report.state.dataset.records[2].sourceLine).toBe(4);
  expect(report.state.review.simulated).toBe(true);
  expect(report.state.outcome.status).toBe("inconclusive");
  expect(report.verifiedSavings).toBeNull();
  expect(report.approvedForCustomerUse).toBe(false);
  expect(errors).toEqual([]);
  expect(backend).toEqual([]);
});
test("no-gap and conflicting inputs fail closed; panel fits mobile without upload", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/investigations");
  const panel = page.getByRole("region", { name: "Reconcile one invoice exception." });
  await panel.getByRole("button", { name: "Load no-gap example" }).click();
  await expect(panel.getByText(/Assessment:.*no documentary exception established/)).toBeVisible();
  await panel.getByRole("button", { name: "Record invoice simulated review" }).click();
  await expect(panel.getByRole("alert")).toContainText("Only a reconciled documentary exception");
  await expect(
    panel.getByRole("button", { name: "Record fictional authorised action" }),
  ).toBeDisabled();
  await panel.getByRole("button", { name: "Load conflicting invoices" }).click();
  await expect(panel.getByText(/Assessment: conflict/)).toBeVisible();
  await expect(panel.getByText(/Multiple invoice records/)).toBeVisible();
  expect(await panel.locator('input[type="file"]').count()).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
