import { test, expect, type Page } from "@playwright/test";
import { provisionLocalReviewer } from "./local-backend";

// No mocked Auth, RPC, case API or database. Runs only against disposable CI Supabase.
async function login(page: Page, email: string) {
  await page.goto("/investigations-connected");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill("gridmind-ci-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("button", { name: "Load my cases" })).toBeVisible();
}
async function caseApi(page: Page, command: Record<string, unknown>) {
  return page.evaluate(async (command) => {
    const key = Object.keys(localStorage).find((k) => /^sb-.*-auth-token$/.test(k));
    const session = key ? JSON.parse(localStorage.getItem(key) ?? "null") : null;
    if (!session?.access_token) throw new Error("No local browser session");
    const response = await fetch("/api/investigations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(command),
    });
    return { status: response.status, body: await response.json() };
  }, command);
}

test("connected case survives lost response and re-login; scoped reviewer verifies independently; foreign tenant is denied", async ({
  page,
  browser,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await login(page, "gridmind-http-a@example.test");
  await expect(page.getByRole("button", { name: "Create synthetic case" })).toBeEnabled();
  const created = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/investigations") && r.request().postDataJSON()?.action === "create",
  );
  await page.getByRole("button", { name: "Create synthetic case" }).click();
  const original = await (await created).json();
  const caseId = original.caseId as string;
  await expect(page.getByText("Revision 1", { exact: true })).toBeVisible();
  let lost = false;
  await page.route("**/api/investigations", async (route) => {
    if (!lost && route.request().postDataJSON()?.action === "save") {
      lost = true;
      const committed = await route.fetch();
      expect(committed.ok()).toBe(true);
      await route.abort("failed");
    } else await route.continue();
  });
  await page
    .getByLabel("Correction reason")
    .fill("Correct invented question in full-stack acceptance");
  await page
    .getByLabel("Decision question", { exact: true })
    .fill("Full-stack persisted synthetic decision question");
  await page.getByRole("button", { name: "Save revision", exact: true }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await page.getByRole("button", { name: "Retry last request" }).click();
  await expect(page.getByText("Revision 2", { exact: true })).toBeVisible();
  await page.unroute("**/api/investigations");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await login(page, "gridmind-http-a@example.test");
  await page.getByRole("button", { name: new RegExp(`^${caseId.slice(0, 8)} · v2`) }).click();
  await expect(page.getByLabel("Decision question", { exact: true })).toHaveValue(
    "Full-stack persisted synthetic decision question",
  );
  await page.getByRole("button", { name: "Evidence", exact: true }).click();
  for (const id of ["E01", "E02", "E03"]) {
    const source = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: new RegExp(`^${id} ·`) }) });
    await source
      .getByLabel("Source checks and verification basis")
      .fill("Checked invented source against the full-stack synthetic fixture");
    const verified = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/investigations") && r.request().postDataJSON()?.action === "verify",
    );
    await source.getByRole("button", { name: "Record source verification" }).click();
    expect((await verified).status()).toBe(200);
    await expect(source.getByText(/Verified for this synthetic method by/)).toBeVisible();
  }
  const factoryResponse = await page.evaluate(async (key) => {
    const sessionKey = Object.keys(localStorage).find((k) => /^sb-.*-auth-token$/.test(k))!;
    const token = JSON.parse(localStorage.getItem(sessionKey)!).access_token;
    const r = await fetch(
      "http://127.0.0.1:54321/rest/v1/factories?select=id,organization_id&name=eq.gridmind-http-factory-a",
      {
        headers: { apikey: key!, Authorization: `Bearer ${token}` },
      },
    );
    return await r.json();
  }, process.env.SUPABASE_ANON_KEY);
  const reviewer = await provisionLocalReviewer(
    factoryResponse[0].id,
    factoryResponse[0].organization_id,
  );
  await page.getByRole("button", { name: "Access", exact: true }).click();
  await page.getByLabel("Existing factory member user ID").fill(reviewer.id);
  await page.getByRole("button", { name: "Save scoped assignment" }).click();
  await expect(page.getByText("Revision 6", { exact: true })).toBeVisible();
  const reviewerContext = await browser.newContext({ baseURL: "http://127.0.0.1:4173" });
  const foreignContext = await browser.newContext({ baseURL: "http://127.0.0.1:4173" });
  try {
    const reviewPage = await reviewerContext.newPage();
    await login(reviewPage, reviewer.email);
    await reviewPage
      .getByRole("button", { name: new RegExp(`^${caseId.slice(0, 8)} · v6`) })
      .click();
    await expect(reviewPage.getByRole("button", { name: "Economics", exact: true })).toHaveCount(0);
    const read = await caseApi(reviewPage, { action: "load", caseId });
    expect(read.body.snapshot.labor).toEqual([]);
    expect(read.body.snapshot.expenses).toEqual([]);
    const selfReview = await caseApi(page, {
      action: "review",
      caseId,
      expectedRevision: 6,
      requestKey: "self-review",
      reviewer: "Exercise owner",
      competence: "Synthetic exercise",
      scope: "Invented sources and claims",
      decision: "accept",
      rationale: "Exercise arithmetic was checked",
      dissent: "",
    });
    expect(selfReview.status).toBe(403);
    await reviewPage.getByRole("button", { name: "Review", exact: true }).click();
    await reviewPage.getByLabel("Declared reviewer name").fill("Independent synthetic reviewer");
    await reviewPage.getByLabel("Relevant competence").fill("Declared fictional method competence");
    await reviewPage
      .getByLabel("Reviewed sources and claims")
      .fill("E01–E03 and all invented calculations");
    await reviewPage.getByLabel("Decision", { exact: true }).selectOption("accept");
    await reviewPage
      .getByLabel("Rationale and checks")
      .fill("Synthetic arithmetic checked; no causal or savings approval");
    await reviewPage.getByRole("button", { name: "Record simulated review" }).click();
    await expect(reviewPage.getByText("synthetic review complete", { exact: false })).toBeVisible();
    await page.getByRole("button", { name: "Reload latest revision" }).click();
    await page.getByRole("button", { name: "History", exact: true }).click();
    await page.getByRole("button", { name: "Open revision 1", exact: true }).click();
    await page.getByRole("button", { name: "Brief", exact: true }).click();
    await expect(page.locator("pre")).toContainText("Customer release:** BLOCKED");
    await expect(page.locator("pre")).not.toContainText(
      "Full-stack persisted synthetic decision question",
    );
    const foreign = await foreignContext.newPage();
    await login(foreign, "gridmind-http-b@example.test");
    expect((await caseApi(foreign, { action: "load", caseId })).status).toBe(403);
    expect((await caseApi(foreign, { action: "list", actorId: reviewer.id })).status).toBe(400);
    expect(errors).toEqual([]);
  } finally {
    await reviewerContext.close();
    await foreignContext.close();
  }
});
