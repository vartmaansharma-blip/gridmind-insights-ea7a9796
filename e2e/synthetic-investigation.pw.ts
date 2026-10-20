import { test, expect, type Page } from "@playwright/test";

const key = "gridmind:synthetic-investigations:v1";
const step = (page: Page, name: string) =>
  page.getByRole("button", { name: new RegExp(`^\\d+\\. ${name}$`) }).click();

test.beforeEach(async ({ context }) => {
  await context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.hostname !== "127.0.0.1" && url.protocol.startsWith("http")) return route.abort();
    return route.continue();
  });
});

test("source correction → save/reload → simulated review → stale review → historical export", async ({
  page,
}) => {
  const errors: string[] = [];
  const backend: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (/supabase|\/auth\/v1|\/rest\/v1|\/functions\/v1/.test(r.url())) backend.push(r.url());
  });
  await page.goto("/investigations");
  await expect(page.getByRole("heading", { name: "Evidence to decision" })).toBeVisible();
  await step(page, "Analysis");
  await expect(
    page.getByText("First-to-last intensity change: 33.33 %", { exact: true }),
  ).toBeVisible();
  await step(page, "Review");
  await page.getByLabel("Reviewer identity (fictional exercise)").fill("Fictional reviewer");
  await page
    .getByLabel("Relevant qualification and competence")
    .fill("Fictional electrical/tariff competence");
  await page
    .getByLabel("Sources, calculations and claims reviewed")
    .fill("E01–E03; all calculations and hypotheses");
  await page.getByLabel("Review decision", { exact: true }).selectOption("accept");
  await page
    .getByLabel("Feedback, corrections and decision rationale")
    .fill("Known arithmetic reconciles; no savings or cause established.");
  await page.getByRole("button", { name: "Record simulated review" }).click();
  await expect(page.getByText("synthetic review complete", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("synthetic review complete", { exact: true })).toBeVisible();
  await step(page, "Evidence");
  const source = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "E01 · Source register", exact: true }) });
  await source
    .getByLabel("Unresolved contradictions (blank only when resolved)")
    .fill("Ledger disagrees with bill");
  await source.getByRole("button", { name: "Save revision" }).click();
  await step(page, "Analysis");
  await expect(
    page.getByText("Calculations withheld until material blockers are resolved."),
  ).toBeVisible();
  await step(page, "Review");
  await expect(page.getByText(/STALE — re-review required/)).toBeVisible();
  await step(page, "Brief");
  await expect(page.locator("pre")).toContainText("Customer release:** BLOCKED");
  await expect(page.locator("pre")).toContainText("Ledger disagrees with bill");
  const exported = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download synthetic Decision Brief" }).click();
  expect((await exported).suggestedFilename()).toMatch(/SYNTHETIC-brief\.md$/);
  await step(page, "History");
  await expect(page.getByRole("button", { name: "Export historical brief" })).toHaveCount(2);
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key);
  expect(saved.cases[0].revision).toBe(3);
  expect(saved.history[1].before.evidence[0].conflict).toBe("");
  expect(saved.cases[0].reviews[0].simulated).toBe(true);
  expect(errors).toEqual([]);
  expect(backend).toEqual([]);
});

test("C1 clock reconciliation produces a 62-minute bounded duration", async ({ page }) => {
  await page.goto("/investigations");
  await page.getByLabel("Investigation", { exact: true }).selectOption("SYN-C1-01");
  await step(page, "Analysis");
  await expect(
    page.getByText("Calculations withheld until material blockers are resolved."),
  ).toBeVisible();
  for (const [id, time] of [
    ["T01", "2026-09-17T08:14:00+05:30"],
    ["T02", "2026-09-17T08:42:00+05:30"],
    ["T03", "2026-09-17T09:16:00+05:30"],
  ]) {
    const event = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: `${id} · Timeline event`, exact: true }) });
    await event.getByLabel("Reconciled timestamp with timezone").fill(time);
    await event.getByLabel("Clock reconciliation verified in this exercise").check();
    await event.getByRole("button", { name: "Save revision" }).click();
  }
  await expect(page.getByText("Recorded stop duration: 62 minutes", { exact: true })).toBeVisible();
  await page.reload();
  await page.getByLabel("Investigation", { exact: true }).selectOption("SYN-C1-01");
  await step(page, "Analysis");
  await expect(page.getByText("Recorded stop duration: 62 minutes", { exact: true })).toBeVisible();
});

test("corrupt storage is recoverable without automatic overwrite; other-tab edits are protected", async ({
  page,
  context,
}) => {
  await page.goto("/investigations");
  await page.evaluate((key) => localStorage.setItem(key, "broken saved bytes"), key);
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("could not be loaded");
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe("broken saved bytes");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Reset synthetic examples" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  const second = await context.newPage();
  await second.goto("/investigations");
  // Navigation can finish before hydration reads the saved snapshot. Establish
  // the second tab's old revision before the first tab writes a newer one.
  await expect(second.getByText("Loaded from this browser", { exact: true })).toBeVisible();
  await page.getByLabel("Decision question", { exact: true }).fill("First tab edit");
  await page.getByRole("button", { name: "Save revision", exact: true }).first().click();
  await expect(second.getByRole("alert")).toContainText("another tab");
  await second.getByLabel("Decision question", { exact: true }).fill("Stale tab edit");
  await second.getByRole("button", { name: "Save revision", exact: true }).first().click();
  await expect(
    second.getByText("Another tab changed this workspace. Reload before saving.", { exact: true }),
  ).toBeVisible();
  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key);
  expect(stored.cases[0].scope.question).toBe("First tab edit");
});

test("mobile workflow and synthetic backup reject real origin and restore valid records", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/investigations");
  await page.getByRole("button", { name: "New C4 exercise" }).click();
  const stored = await page.evaluate((key) => localStorage.getItem(key)!, key);
  await page.getByRole("button", { name: "Restore synthetic backup" }).click();
  await page
    .getByLabel("Synthetic backup JSON")
    .fill(stored.replace('"origin":"synthetic"', '"origin":"customer"'));
  await page.getByRole("button", { name: "Validate and restore backup" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(stored);
  await page.getByLabel("Synthetic backup JSON").fill(stored);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Validate and restore backup" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test("validated backup restores a corrupt workspace without discarding the raw bytes first", async ({
  page,
}) => {
  await page.goto("/investigations");
  await page.getByRole("button", { name: "New C1 exercise" }).click();
  const backup = await page.evaluate((key) => localStorage.getItem(key)!, key);
  await page.evaluate((key) => localStorage.setItem(key, "corrupt bytes"), key);
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("could not be loaded");
  await page.getByRole("button", { name: "Restore synthetic backup" }).click();
  await page.getByLabel("Synthetic backup JSON").fill(backup);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Validate and restore backup" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  const restored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key);
  expect(restored.cases).toHaveLength(3);
});

test("removing a bad source preserves history and blocks unresolved links", async ({ page }) => {
  await page.goto("/investigations");
  await step(page, "Evidence");
  const source = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "E01 · Source register", exact: true }) });
  page.once("dialog", (dialog) => dialog.accept());
  await source.getByRole("button", { name: "Remove record (retained in History)" }).click();
  await step(page, "Analysis");
  await expect(
    page.getByText("Calculations withheld until material blockers are resolved."),
  ).toBeVisible();
  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key);
  expect(stored.cases[0].evidence).toHaveLength(2);
  expect(stored.history[0].before.evidence[0].id).toBe("E01");
  expect(stored.history[0].reason).toContain("Removed evidence/E01");
});

test("Resolve discovery switches fictional lanes without intake, persistence or backend access", async ({
  page,
}) => {
  const backend: string[] = [];
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (/supabase|\/auth\/v1|\/rest\/v1|\/functions\/v1|\/api\//.test(request.url())) {
      backend.push(request.url());
    }
  });
  await page.goto("/investigations");
  const preview = page.getByRole("region", {
    name: "GridMind Resolve — synthetic commercial discovery preview",
  });
  await expect(
    preview.getByRole("button", { name: "R1 · Quality & production exceptions" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { name: "Evidence to decision" })).toBeVisible();
  const saved = await page.evaluate(() => JSON.stringify({ ...localStorage }));
  for (const width of [1365, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [lane, title, question] of [
      ["R1", "Quality & production exceptions", "repeat component-rejection complaint"],
      ["R2", "Acceptance & invoice disputes", "disputes acceptance of delivered components"],
      ["R3", "Electricity exposure", "understand an electricity billing change"],
    ]) {
      const button = preview.getByRole("button", { name: `${lane} · ${title}` });
      await button.click();
      await expect(button).toHaveAttribute("aria-pressed", "true");
      await expect(preview.getByRole("button", { pressed: true })).toHaveCount(1);
      await expect(preview).toContainText(question);
      await expect(preview).toContainText("No commercial wedge is validated");
      await expect(preview).toContainText("simulated review needed");
      await expect(preview).toContainText("never approved for customer delivery");
      await expect(preview.locator("input, textarea, select, form, a")).toHaveCount(0);
      expect(await page.evaluate(() => JSON.stringify({ ...localStorage }))).toBe(saved);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  await page.reload();
  await expect(
    preview.getByRole("button", { name: "R1 · Quality & production exceptions" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { name: "Evidence to decision" })).toBeVisible();
  expect(backend).toEqual([]);
  expect(errors).toEqual([]);
});
