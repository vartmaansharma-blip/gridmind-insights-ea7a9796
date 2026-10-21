import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

test("finishing evidence exports original invented source and a pending review without backend access", async ({
  page,
}) => {
  const backend: string[] = [];
  await page.route(/\/api\/|supabase\./, (route) => {
    backend.push(route.request().url());
    return route.abort();
  });
  await page.goto("/investigations");
  const section = page.getByRole("region", { name: "Which finishing work needs a closer look?" });
  await section.getByRole("button", { name: "Compare invented lots", exact: true }).click();
  await expect(section.getByText("Comparison: Descriptive only", { exact: true })).toBeVisible();
  await expect(section.getByRole("row", { name: "SYN-BATCH-1 100 50 0 150 1.579" })).toBeVisible();
  const download = page.waitForEvent("download");
  await section.getByRole("button", { name: "Download synthetic review draft" }).click();
  const file = await (await download).path();
  expect(file).toBeTruthy();
  const report = JSON.parse(await readFile(file!, "utf8"));
  expect(createHash("sha256").update(report.sourceText).digest("hex")).toBe(report.sourceSha256);
  expect(report.rootCause).toBeNull();
  expect(report.verifiedSavings).toBeNull();
  expect(report.approvedForCustomerUse).toBe(false);
  expect(report.caseDraft.simulatedReview).toBeNull();
  expect(backend).toEqual([]);
});

test("unknown time blocks interpretation and required-only work disconfirms the rework offer on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/investigations");
  const section = page.getByRole("region", { name: "Which finishing work needs a closer look?" });
  await section.getByRole("button", { name: "Show unclassified time", exact: true }).click();
  await expect(section.getByText("Comparison: Inconclusive", { exact: true })).toBeVisible();
  await expect(section.getByText("Unclassified finishing time", { exact: true })).toBeVisible();
  await section.getByRole("button", { name: "Show required work only", exact: true }).click();
  await expect(section.getByText(/No repeat work is recorded/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
