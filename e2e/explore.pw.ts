import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
test("anonymous visitor completes one connected manufacturing investigation without backend access", async ({
  page,
  context,
}) => {
  const backend: string[] = [],
    errors: string[] = [];
  await context.route("**/*", (route) => {
    const u = new URL(route.request().url());
    if (/supabase|\/api\/|\/auth\/v1|\/rest\/v1/.test(u.href)) backend.push(u.pathname);
    return u.protocol.startsWith("http") && u.hostname !== "127.0.0.1"
      ? route.abort()
      : route.continue();
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("link", { name: "Explore GridMind", exact: true }).first().click();
  await expect(page).toHaveURL(/\/explore$/);
  await page.getByRole("button", { name: "Start Exploring", exact: true }).click();
  await expect(page.getByText("GridMind Example Components", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Machines & Resources", exact: true }).click();
  const machine = page.getByRole("form", { name: "Register machine", exact: true });
  await machine.getByLabel("Machine identifier").fill("press-03");
  await machine.getByLabel("Machine name").fill("Press 03");
  await machine.getByRole("button", { name: "Register machine", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Press 03", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Production & Materials", exact: true }).click();
  const order = page.getByRole("form", { name: "Create sample order", exact: true });
  await order.getByLabel("Order identifier").fill("order-03");
  await order.getByLabel("Compatible machine").selectOption("press-03");
  await order.getByRole("button", { name: "Create sample order", exact: true }).click();
  await expect(page.getByText(/work-order|work-order/, {}).first()).toBeVisible();
  await page.getByRole("button", { name: "Investigations", exact: true }).click();
  const incident = page.getByRole("form", { name: "Open sample investigation", exact: true });
  await incident.getByLabel("Affected record").selectOption("press-03");
  await incident.getByLabel("Investigation title").fill("Press 03 stopped");
  await incident.getByRole("button", { name: "Open sample investigation", exact: true }).click();
  const detail = page.getByRole("region", { name: /Investigation case-/ });
  await expect(detail).toContainText("Orders: order-03.");
  await expect(detail).not.toContainText("second-order");
  await detail.getByRole("button", { name: "Evaluate current alternatives", exact: true }).click();
  await expect(detail.getByText(/Press 01: Eligible for simulated review/)).toBeVisible();
  await expect(detail.getByText(/Press 03: Blocked or needs review/)).toBeVisible();
  const review = detail.getByRole("form", { name: "Record simulated review", exact: true });
  await review.getByLabel("Simulated manager decision").selectOption("approve_for_simulation");
  await review
    .getByLabel("Simulated review note")
    .fill("Compare the available press before action");
  await review.getByRole("button", { name: "Record simulated review", exact: true }).click();
  await expect(detail.getByText("Decision: approve_for_simulation", { exact: true })).toBeVisible();
  const outcome = detail.getByRole("form", { name: "Record sample outcome", exact: true });
  await outcome.getByLabel("Outcome note").fill("No actual production measured");
  await outcome.getByRole("button", { name: "Record sample outcome", exact: true }).click();
  await detail.getByRole("button", { name: "Inspect related orders and materials" }).click();
  await expect(page.getByText(/routing-order-03/)).toBeVisible();
  await page.getByRole("button", { name: "Reports & History", exact: true }).click();
  await expect(page.getByText(/unresolved — No actual production measured/)).toBeVisible();
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download SYNTHETIC organization report" }).click();
  const file = await pending;
  expect(file.suggestedFilename()).toContain("SYNTHETIC");
  const report = JSON.parse(await readFile((await file.path())!, "utf8"));
  expect(report.classification).toBe("SYNTHETIC");
  expect(report.workspace.cases[0].reviews[0].realAuthorization).toBe(false);
  expect(report.workspace.cases[0].orderIds).toEqual(["order-03"]);
  expect(report.workspace.core.entities.some((e: { id: string }) => e.id === "press-03")).toBe(
    true,
  );
  expect(backend).toEqual([]);
  expect(errors).toEqual([]);
});
test("mobile setup, guided/explore modes, validation, stale results and reset share one sample", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/*", (route) => {
    const u = new URL(route.request().url());
    return u.protocol.startsWith("http") && u.hostname !== "127.0.0.1"
      ? route.abort()
      : route.continue();
  });
  await page.goto("/explore");
  await page.getByRole("button", { name: "Build a Sample Factory" }).click();
  const profile = page.getByRole("form", { name: "Save sample organization" });
  await profile.getByLabel("Organization name").fill("SYNTHETIC visitor organization");
  await profile.getByRole("button", { name: "Save sample organization" }).click();
  await expect(page.getByText("SYNTHETIC visitor organization", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Explore mode", exact: true }).click();
  await page.getByRole("button", { name: "Machines & Resources", exact: true }).click();
  await page
    .getByRole("form", { name: "Register machine", exact: true })
    .getByLabel("Machine identifier")
    .fill("press");
  await page.getByRole("button", { name: "Register machine", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("already exists");
  await page.getByRole("button", { name: "Reset Sample Workspace" }).click();
  await expect(page.getByRole("button", { name: "Start Exploring", exact: true })).toBeVisible();
  await expect(page.getByText("GridMind Example Components", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Start Exploring", exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByText("GridMind areas", { exact: true }).click();
  const nav = page.getByRole("navigation", { name: "Global GridMind navigation" });
  await nav.getByRole("link", { name: /^Profile/ }).click();
  await expect(page).toHaveURL(/\/auth\?destination=profile$/);
});
test("untrusted browser metadata cannot authorize sample access to real records, refresh resets", async ({
  page,
}) => {
  const api: string[] = [];
  await page.addInitScript(() =>
    localStorage.setItem(
      "sample-test-account-context",
      JSON.stringify({ role: "owner", organizationId: 999 }),
    ),
  );
  await page.route("**/*", (route) => {
    const u = new URL(route.request().url());
    if (/\/api\/|\/rest\/v1/.test(u.pathname)) api.push(u.pathname);
    return u.protocol.startsWith("http") && u.hostname !== "127.0.0.1"
      ? route.abort()
      : route.continue();
  });
  await page.goto("/explore");
  await page.getByRole("button", { name: "Start Exploring", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Start Exploring", exact: true })).toBeVisible();
  expect(api).toEqual([]);
});

test("deep links, browser history, draft continuity, keyboard navigation and grounded assistant", async ({
  page,
}) => {
  await page.route("**/*", (route) => {
    const u = new URL(route.request().url());
    return u.protocol.startsWith("http") && u.hostname !== "127.0.0.1"
      ? route.abort()
      : route.continue();
  });
  const calls: string[] = [];
  page.on("request", (r) => {
    if (/anthropic|supabase|\/api\//.test(r.url())) calls.push(r.url());
  });
  await page.goto("/explore/machines/press");
  await expect(page.getByRole("region", { name: "Record press", exact: true })).toBeVisible();
  const form = page.getByRole("form", { name: "Register machine", exact: true });
  await form.getByLabel("Machine identifier").fill("draft-press");
  await form.getByLabel("Machine name").fill("Unsubmitted press");
  await page.getByRole("button", { name: "Production & Materials", exact: true }).click();
  await page.goBack();
  await expect(form.getByLabel("Machine name")).toHaveValue("Unsubmitted press");
  await page
    .getByRole("region", { name: "Record press", exact: true })
    .getByRole("link")
    .first()
    .click();
  await expect(page).toHaveURL(/\/explore\/[^/]+\/[^/]+/);
  await page.getByRole("button", { name: "Ask GridMind", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Not generated by Claude");
  await dialog.getByLabel("Question", { exact: true }).fill("What do the current records support?");
  await dialog.getByRole("button", { name: "Explain current context" }).click();
  await expect(dialog.getByRole("heading", { name: "What the records support" })).toBeVisible();
  await expect(dialog).toContainText("Human review required");
  await dialog.getByText(/^Sources/).click();
  await expect(dialog).toContainText("SHA-256");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  const summary = page.getByText("GridMind areas", { exact: true });
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("navigation", { name: "Global GridMind navigation" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(summary).toBeFocused();
  await expect(
    page.getByRole("navigation", { name: "Global GridMind navigation" }),
  ).not.toBeVisible();
  await page.goto("/explore/machines/missing-record");
  await expect(page.getByText("Record not available in this sample session")).toBeVisible();
  expect(calls).toEqual([]);
});

test("browser preferences affect sample appearance without storing factory records", async ({
  page,
}) => {
  await page.route("**/*", (route) => {
    const u = new URL(route.request().url());
    return u.protocol.startsWith("http") && u.hostname !== "127.0.0.1"
      ? route.abort()
      : route.continue();
  });
  await page.goto("/profile");
  await page.getByLabel("Theme", { exact: true }).selectOption("dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByLabel("Simpler motion", { exact: true }).check();
  await page.getByLabel("Display density", { exact: true }).selectOption("compact");
  await page.getByLabel("Start sample in guided mode", { exact: true }).uncheck();
  await page.getByLabel("Collapse workspace sidebar", { exact: true }).check();
  await page.goto("/explore/machines/press");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  await expect(page.locator("html")).toHaveAttribute("data-density", "compact");
  await expect(page.getByText("Your guided journey", { exact: true })).not.toBeVisible();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem("gridmind.preferences.v1")!)),
  ).toEqual(
    expect.objectContaining({
      theme: "dark",
      reducedMotion: true,
      sidebarCollapsed: true,
      guided: false,
    }),
  );
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("preference controls wait for hydration before accepting the first change", async ({
  page,
}) => {
  let release!: () => void;
  const scriptsReady = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/*", async (route) => {
    const u = new URL(route.request().url());
    if (u.protocol.startsWith("http") && u.hostname !== "127.0.0.1") return route.abort();
    if (u.pathname.endsWith(".js")) await scriptsReady;
    return route.continue();
  });
  const navigation = page.goto("/profile");
  const theme = page.getByLabel("Theme", { exact: true });
  try {
    await expect(theme).toBeDisabled();
  } finally {
    release();
  }
  await navigation;
  await theme.selectOption("dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.goto("/explore/machines/press");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("assistant composer supports keyboard conversation, evidence, limits and reset without backend access", async ({
  page,
}) => {
  const calls: string[] = [];
  await page.route("**/*", (route) => {
    const u = new URL(route.request().url());
    if (/anthropic|supabase|\/api\//.test(u.href)) calls.push(u.pathname);
    return u.protocol.startsWith("http") && u.hostname !== "127.0.0.1"
      ? route.abort()
      : route.continue();
  });
  await page.goto("/explore/machines/press");
  const trigger = page.getByRole("button", { name: "Ask GridMind", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog"),
    question = dialog.getByLabel("Question", { exact: true });
  await expect(dialog.getByRole("heading", { name: "Ask GridMind", exact: true })).toBeFocused();
  await expect(dialog.getByRole("button", { name: "Explain current context" })).toBeDisabled();
  await dialog.getByRole("button", { name: "See what needs review" }).click();
  await expect(question).toBeFocused();
  await expect(dialog.getByLabel("Explanation mode")).toHaveValue("Investigate");
  await question.press("Shift+Enter");
  await question.pressSequentially("Use current sources only");
  await expect(question).toHaveValue(/\nUse current sources only$/);
  await question.press("Enter");
  await expect(dialog.getByRole("heading", { name: "What the records support" })).toHaveCount(1);
  await dialog
    .getByText(/^Sources/)
    .first()
    .click();
  await expect(
    dialog.getByText("SYNTHETIC connected organization initialization recipe", { exact: true }),
  ).toBeVisible();
  await dialog.getByText("Assumptions & uncertainty", { exact: true }).first().click();
  await expect(dialog.getByText(/No actual production outcome/)).toBeVisible();
  for (let i = 2; i <= 6; i++) {
    await question.fill(`Explain current records ${i}`);
    await question.press("Enter");
    await expect(dialog.getByRole("heading", { name: "What the records support" })).toHaveCount(i);
  }
  await question.fill("One more");
  await expect(dialog.getByRole("button", { name: "Explain current context" })).toBeDisabled();
  await expect(dialog).toContainText("Six explanations reached");
  await dialog.getByRole("button", { name: "Reset explanation" }).click();
  await expect(dialog.getByRole("heading", { name: "What the records support" })).toHaveCount(0);
  await expect(question).toBeEmpty();
  await expect(question).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  expect(calls).toEqual([]);
  await page.goto("/explore/machines/unavailable-record");
  await page.getByRole("button", { name: "Ask GridMind", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("No record was loaded");
  await expect(
    page.getByRole("dialog").getByRole("button", { name: "Explain current context" }),
  ).toBeDisabled();
});

test("assistant fits mobile and short viewports with a usable composer and context controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.route("**/*", (route) => {
    const u = new URL(route.request().url());
    return u.protocol.startsWith("http") && u.hostname !== "127.0.0.1"
      ? route.abort()
      : route.continue();
  });
  await page.goto("/explore/machines/press");
  await page.getByRole("button", { name: "Ask GridMind", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Context", exact: true }).click();
  await expect(dialog.getByRole("region", { name: "Current assistant context" })).toBeVisible();
  await dialog.getByRole("button", { name: "Local sample", exact: true }).click();
  await expect(dialog.getByRole("region", { name: "Assistant capability" })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 420 });
  const input = dialog.getByLabel("Question", { exact: true });
  await input.fill("Explain this fictional press");
  const send = dialog.getByRole("button", { name: "Explain current context" });
  await expect(send).toBeInViewport({ ratio: 1 });
  const bounds = await send.boundingBox();
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(420);
  expect(bounds!.height).toBeGreaterThanOrEqual(44);
  await send.click();
  await expect(dialog.getByRole("heading", { name: "What the records support" })).toHaveCount(1);
  expect(await dialog.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(true);
});

test("sample record finder filters, favorites, inspects, remembers and resets without persistence", async ({
  page,
  context,
}) => {
  const backend: string[] = [];
  await context.route("**/*", (route) => {
    const u = new URL(route.request().url());
    if (/supabase|\/api\/|\/auth\/v1|\/rest\/v1/.test(u.href)) backend.push(u.pathname);
    return u.protocol.startsWith("http") && u.hostname !== "127.0.0.1"
      ? route.abort()
      : route.continue();
  });
  await page.goto("/explore/machines/press");
  await page.getByRole("button", { name: "Find sample records", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Find sample records", exact: true });
  await dialog.getByRole("textbox", { name: "Search sample records" }).fill("Press 01");
  await dialog.getByLabel("Record type", { exact: true }).selectOption("resource");
  await dialog.getByRole("button", { name: "Favorite Press 01", exact: true }).click();
  await expect(
    dialog.getByRole("button", { name: "Favorite Press 01", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await dialog.getByLabel("Show", { exact: true }).selectOption("favorites");
  await dialog.getByRole("button", { name: "Inspect Press 01", exact: true }).click();
  const sheet = page.getByRole("dialog", { name: "Press 01", exact: true });
  await expect(sheet).toContainText("SYNTHETIC");
  await expect(sheet).toContainText("Content integrity and assumptions");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Find sample records", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Control+k");
  await dialog.getByLabel("Show", { exact: true }).selectOption("recent");
  await expect(dialog.getByRole("link", { name: /Press 01/ })).toBeVisible();
  await dialog.getByRole("textbox", { name: "Search sample records" }).fill("no such record");
  await expect(dialog.getByText(/No matching records/)).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Reset Sample Workspace", exact: true }).click();
  await page.getByRole("button", { name: "Find sample records", exact: true }).click();
  await dialog.getByLabel("Show", { exact: true }).selectOption("favorites");
  await expect(dialog.getByText("0 matching sample records", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 390, height: 700 });
  await page.getByRole("button", { name: "Find sample records", exact: true }).click();
  expect(await dialog.evaluate((e) => e.getBoundingClientRect().right)).toBeLessThanOrEqual(390);
  expect(backend).toEqual([]);
});
