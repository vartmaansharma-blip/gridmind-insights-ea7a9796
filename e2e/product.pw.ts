import { test, expect } from "@playwright/test";
test.beforeEach(async ({ context }) => {
  await context.route("**/*", (route) => {
    const u = new URL(route.request().url());
    return u.hostname !== "127.0.0.1" && u.protocol.startsWith("http")
      ? route.abort()
      : route.continue();
  });
});
test("released public website keeps its existing reviewed sample until preview release", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/website");
  await expect(page.getByRole("heading", { level: 1 }).first())
    .toContainText("A clear decision starts with a clear evidence chain.");
  await page.getByRole("button", { name: "Read the sample brief" }).click();
  await expect(page.getByRole("dialog")).toContainText("SYNTHETIC SAMPLE");
  await page.getByRole("link", { name: "Explore the sample workspace" }).click();
  await expect(page.getByRole("heading", { name: "Your investigations", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("Lovable design is a separate preview with the agreed green hook and working request-only contact path", async ({ page }) => {
  await page.goto("/design-preview");
  await expect(page.getByRole("heading", { level: 1 }).first())
    .toContainText("Everything is connected.");
  await expect(page.getByRole("heading", { level: 1 }).first())
    .toContainText("What are we missing?");
  await page.getByRole("button", { name: /Average power factor/i }).click();
  await expect(page.locator("#example")).toContainText("Does power factor affect anything on this bill?");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download fictional brief" }).click();
  expect((await download).suggestedFilename()).toMatch(/FICTIONAL\\.txt$/);
  const contact = page.locator("#contact");
  await expect(contact).not.toContainText("Contact route pending");
  await expect(contact.getByRole("link", { name: "Request a conversation" })).toHaveAttribute("href", "/cases");
  await page.getByRole("link", { name: "Explore the sample workspace" }).click();
  await expect(page.getByRole("heading", { name: "Your investigations", exact: true })).toBeVisible();
});

test("customer view shows sample brief and decision without staff controls; mobile fits", async ({
  page,
}) => {
  await page.goto("/cases?mode=demo");
  await page.getByRole("link", { name: "Open investigation" }).first().click();
  await page.getByRole("button", { name: "Brief", exact: true }).click();
  await expect(page.locator("pre")).toContainText("SYNTHETIC SAMPLE");
  await expect(page.getByRole("button", { name: "Delivery", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Economics", exact: true })).toHaveCount(0);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download brief" }).click();
  expect((await download).suggestedFilename()).toMatch(/SAMPLE.md$/);
  await page.getByRole("button", { name: "Decision", exact: true }).click();
  await page
    .getByLabel("Decision rationale and next action")
    .fill("Defer until the invented source boundary is clarified.");
  await page.getByRole("button", { name: "Record decision", exact: true }).click();
  await expect(
    page.getByText("Defer until the invented source boundary is clarified.", { exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test("sample intake connects customer and team without duplicating accepted cases", async ({
  page,
}) => {
  await page.goto("/cases?mode=demo");
  await page.getByRole("button", { name: "New investigation", exact: true }).click();
  await page.getByLabel("Investigation title", { exact: true }).fill("Invented bounded request");
  await page.getByLabel("Site or process").fill("Invented line");
  await page
    .getByLabel("What decision do you need to make?")
    .fill("Which invented record should be reconciled next?");
  await page.getByLabel("Period start").fill("2026-01-01");
  await page.getByLabel("Period end").fill("2026-03-31");
  await page.getByRole("button", { name: "Submit investigation request" }).click();
  await expect(page.getByText("Submitted · awaiting team scope review")).toBeVisible();
  await page.goto("/team/intake?mode=demo");
  await expect(
    page.getByRole("heading", { name: "Invented bounded request", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Accept scope and open case" }).click();
  await expect(page.getByRole("link", { name: "Open accepted case" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Accept scope and open case" })).toHaveCount(0);
  await page.goto("/cases?mode=demo");
  await expect(
    page.getByRole("heading", { name: "Invented bounded request", exact: true }),
  ).toBeVisible();
});
