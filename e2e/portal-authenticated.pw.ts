import { test, expect, type Page } from "@playwright/test";
import { requireLocalOnlyRequests } from "./nonproduction-network";
import {
  provisionLocalCustomer,
  provisionLocalReviewer,
  localBackend,
  localIntakeOrganization,
} from "./local-backend";
async function login(page: Page, email: string, destination: "customer" | "team") {
  await requireLocalOnlyRequests(page.context());
  await page.goto(`/auth?destination=${destination}`);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill("gridmind-ci-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: destination === "customer" ? "Your investigations" : "Investigations",
      exact: true,
    }),
  ).toBeVisible();
}
async function api(page: Page, command: Record<string, unknown>, path = "/api/portal") {
  return page.evaluate(
    async ({ command, path }) => {
      const k = Object.keys(localStorage).find((k) => /^sb-.*-auth-token$/.test(k));
      const s = k ? JSON.parse(localStorage.getItem(k) ?? "null") : null;
      if (!s?.access_token) throw new Error("No local browser session");
      const r = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${s.access_token}` },
        body: JSON.stringify(command),
      });
      return { status: r.status, body: await r.json() };
    },
    { command, path },
  );
}
test.afterEach(async ({ page }, info) => {
  if (info.status !== info.expectedStatus)
    console.error(
      "Portal visible fixture state:",
      (await page.locator("body").innerText()).slice(0, 6000),
    );
});
test("new customer follows public login, factory request, team approval and case-only dashboard", async ({ page, browser }) => {
  const customer = await provisionLocalCustomer();
  await requireLocalOnlyRequests(page.context());
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 }).first()).toContainText("What are we missing?");
  await page.getByRole("link", { name: "Connect your factory" }).click();
  await expect(page.getByRole("heading", { name: "Start with your factory, not a sensor." })).toBeVisible();
  await page.getByRole("link", { name: "Continue securely" }).click();
  await page.getByLabel("Email", { exact: true }).fill(customer.email);
  await page.getByLabel("Password", { exact: true }).fill("gridmind-ci-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Request a factory introduction" })).toBeVisible();
  const factory = `Invented acceptance plant ${crypto.randomUUID().slice(0, 6)}`;
  await page.getByLabel("Factory or business name").fill(factory);
  await page.getByLabel("City or industrial area").fill("Synthetic City");
  await page.getByLabel("Primary process or equipment type").fill("Synthetic machining");
  await page.getByLabel("What would you like GridMind to investigate?").fill("Which fictional meter record needs checking?");
  await page.getByLabel("Period start").fill("2026-01-01");
  await page.getByLabel("Period end").fill("2026-02-28");
  await page.getByRole("button", { name: "Submit connection request" }).click();
  await expect(page.getByRole("heading", { name: "Introduction request submitted" })).toBeVisible();
  const request = (await api(page, { action: "intakeList" })).body.requests;
  expect(request).toHaveLength(1);
  expect(request[0].payload.site).toContain(factory);
  expect(request[0].caseId).toBeNull();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Your introduction is awaiting GridMind review" })).toBeVisible();
  const staffContext = await browser.newContext({ baseURL: "http://127.0.0.1:4173" });
  try {
    const staff = await staffContext.newPage();
    await login(staff, "gridmind-http-a@example.test", "team");
    await staff.goto("/team/intake");
    const card = staff.locator("section").filter({ has: staff.getByRole("heading", { name: `Factory introduction — ${factory}`, exact: true }) });
    await expect(card).toBeVisible();
    await card.getByRole("button", { name: "Accept scope and open case" }).click();
    await expect(card.getByRole("link", { name: "Open accepted case" })).toBeVisible();
    await page.getByRole("button", { name: "Refresh request status" }).click();
    await expect(page.getByRole("heading", { name: "Your investigation workspace is available" })).toBeVisible();
    await page.getByRole("link", { name: "Open your dashboard" }).click();
    await expect(page.getByRole("heading", { name: "Your investigations", exact: true })).toBeVisible();
    await page.goto("/app/overview");
    await expect(page.getByRole("heading", { name: "This workspace is for authorized factory staff" })).toBeVisible();
  } finally {
    await staffContext.close();
  }
});

test("website/customer/team integration preserves case-only access and automatically publishes after independent review", async ({
  page,
  browser,
}) => {
  const customer = await provisionLocalCustomer(),
    foreign = await provisionLocalCustomer();
  const submitRequests: string[] = [];
  await page.route("**/api/portal", async (route) => {
    if (route.request().postDataJSON()?.action !== "submit") return route.continue();
    submitRequests.push(route.request().postData()!);
    if (submitRequests.length === 1) {
      const response = await route.fetch();
      expect(response.status()).toBe(200);
      return route.abort("connectionfailed"); // Server committed; customer never received its receipt.
    }
    return route.continue();
  });
  await login(page, customer.email, "customer");
  await page.getByRole("button", { name: "New investigation", exact: true }).click();
  const title = `Synthetic integrated request ${crypto.randomUUID().slice(0, 8)}`;
  await page.getByLabel("Investigation title", { exact: true }).fill(title);
  await page.getByLabel("Site or process").fill("Invented customer site");
  await page
    .getByLabel("What decision do you need to make?")
    .fill("Which documented next check is justified by the invented comparison?");
  await page.getByLabel("Period start").fill("2026-01-01");
  await page.getByLabel("Period end").fill("2026-03-31");
  const submission = page.waitForResponse(
    (r) => r.url().endsWith("/api/portal") && r.request().postDataJSON()?.action === "submit",
  );
  await page.getByRole("button", { name: "Submit investigation request" }).click();
  const submitted = await submission;
  if (!submitted.ok()) {
    // Disposable loopback fixtures only. Diagnose RPC failures without ever exposing an admin token.
    const command = submitted.request().postDataJSON();
    const { origin, serviceKey } = localBackend();
    const probe = await fetch(`${origin}/rest/v1/rpc/portal_store`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        _actor: customer.id,
        _op: "intake_submit",
        _args: {
          id: command.id,
          organizationId: Number(await localIntakeOrganization()),
          payload: command.payload,
          fingerprint: "isolated-diagnostic",
        },
      }),
    });
    const detail = await probe.json();
    throw new Error(
      `Isolated intake API HTTP ${submitted.status()}; RPC probe HTTP ${probe.status}: ${JSON.stringify(detail)}`,
    );
  }
  await expect(page.getByText("Submitted · awaiting team scope review")).toBeVisible();
  expect(submitRequests).toHaveLength(2);
  expect(submitRequests[0]).toBe(submitRequests[1]);
  expect((await api(page, { action: "intakeList" })).body.requests).toHaveLength(1);
  const staffContext = await browser.newContext({ baseURL: "http://127.0.0.1:4173" }),
    reviewerContext = await browser.newContext({ baseURL: "http://127.0.0.1:4173" }),
    foreignContext = await browser.newContext({ baseURL: "http://127.0.0.1:4173" });
  try {
    const staff = await staffContext.newPage();
    await login(staff, "gridmind-http-a@example.test", "team");
    await staff.getByRole("link", { name: "Intake", exact: true }).first().click();
    const intake = staff
      .locator("section")
      .filter({ has: staff.getByRole("heading", { name: title, exact: true }) });
    await expect(intake).toBeVisible();
    await expect(
      intake.getByLabel(
        "Publish the customer-safe brief automatically after current independent review passes.",
      ),
    ).toBeChecked();
    const accepted = staff.waitForResponse(
      (r) => r.url().endsWith("/api/portal") && r.request().postDataJSON()?.action === "accept",
    );
    await intake.getByRole("button", { name: "Accept scope and open case" }).click();
    const caseId = (await (await accepted).json()).caseId as string;
    expect(caseId).toMatch(/^[a-f0-9-]+$/);
    await intake.getByRole("link", { name: "Open accepted case" }).click();
    await expect(staff.getByRole("heading", { name: title, exact: true })).toBeVisible();
    await staff.getByRole("button", { name: "Evidence", exact: true }).click();
    await staff.getByLabel("Source ID", { exact: true }).fill("E01");
    await staff
      .getByLabel("What is needed and why?")
      .fill("Provide the invented January bill reference and limitations.");
    await staff.getByRole("button", { name: "Request evidence", exact: true }).click();
    await page.getByRole("button", { name: "Refresh", exact: true }).click();
    await page.getByRole("link", { name: "Open investigation", exact: true }).click();
    await page.getByRole("button", { name: "Evidence", exact: true }).click();
    await expect(
      page.getByText("Provide the invented January bill reference and limitations.", {
        exact: true,
      }),
    ).toBeVisible();
    await page.getByLabel("Source reference or handover reference").fill("SYNTHETIC-BILL-JAN");
    await page
      .getByLabel("Response and limitations")
      .fill("Invented record for isolated acceptance; no actual customer source.");
    await page.getByRole("button", { name: "Send evidence response" }).click();
    await expect(
      page.getByText("Response received · awaiting reconciliation", { exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Work", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Delivery", exact: true })).toHaveCount(0);
    const { origin, serviceKey } = localBackend();
    const f = await fetch(
      `${origin}/rest/v1/factories?name=eq.gridmind-http-factory-a&select=id,organization_id`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
    );
    const [factory] = await f.json();
    const reviewer = await provisionLocalReviewer(factory.id, factory.organization_id);
    let current = (await api(staff, { action: "load", caseId }, "/api/investigations")).body;
    expect(
      (
        await api(
          staff,
          {
            action: "assign",
            caseId,
            expectedRevision: current.revision,
            requestKey: crypto.randomUUID(),
            userId: reviewer.id,
            role: "reviewer",
            active: true,
            expiresAt: null,
          },
          "/api/investigations",
        )
      ).status,
    ).toBe(200);
    current = (await api(staff, { action: "load", caseId }, "/api/investigations")).body;
    for (const source of current.snapshot.evidence) {
      const verified = await api(
        staff,
        {
          action: "verify",
          caseId,
          expectedRevision: current.revision,
          requestKey: crypto.randomUUID(),
          evidenceId: source.id,
          basis: "Compared invented source rows with the synthetic fixture.",
        },
        "/api/investigations",
      );
      expect(verified.status).toBe(200);
      current = verified.body;
    }
    const reviewPage = await reviewerContext.newPage();
    await login(reviewPage, reviewer.email, "team");
    await reviewPage.goto(`/team/cases/${caseId}`);
    await reviewPage.getByRole("button", { name: "Work", exact: true }).click();
    await expect(
      reviewPage.getByText(`Revision ${current.revision}`, { exact: true }),
    ).toBeVisible();
    await reviewPage.getByRole("button", { name: "Review", exact: true }).click();
    await reviewPage.getByLabel("Declared reviewer name").fill("Assigned synthetic reviewer");
    await reviewPage.getByLabel("Relevant competence").fill("Declared fictional method competence");
    await reviewPage
      .getByLabel("Reviewed sources and claims")
      .fill("E01–E03 and all invented period calculations");
    await reviewPage.getByLabel("Decision", { exact: true }).selectOption("accept");
    await reviewPage
      .getByLabel("Rationale and checks")
      .fill("Known sample arithmetic checked; no cause or savings approval");
    await reviewPage.getByRole("button", { name: "Record simulated review" }).click();
    await expect(reviewPage.getByText("synthetic review complete", { exact: false })).toBeVisible();
    await page.getByRole("button", { name: "Refresh", exact: true }).click();
    await page.getByRole("button", { name: "Brief", exact: true }).click();
    await expect(page.locator("pre")).toContainText("SYNTHETIC SAMPLE");
    const dto = await api(page, { action: "load", caseId });
    expect(dto.status).toBe(200);
    expect(dto.body).not.toHaveProperty("snapshot");
    expect(dto.body).not.toHaveProperty("expenses");
    expect(dto.body).not.toHaveProperty("reviews");
    expect(dto.body.publication).not.toBeNull();
    await page.getByRole("button", { name: "Decision", exact: true }).click();
    await page
      .getByLabel("Decision rationale and next action")
      .fill("Defer the physical decision pending another documented check.");
    let decisionRequests = 0,
      failedRefreshes = 0;
    await page.route("**/api/portal", async (route) => {
      const action = route.request().postDataJSON()?.action;
      if (action === "decision") decisionRequests++;
      if (action === "list" && decisionRequests && failedRefreshes < 3) {
        failedRefreshes++;
        return route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ error: "TEMPORARY_UNAVAILABLE" }),
        });
      }
      return route.fallback();
    });
    await page.getByRole("button", { name: "Record decision", exact: true }).click();
    const savedNotice = page.getByText(
      "Saved successfully. The latest workspace could not be refreshed; automatic refresh will try again.",
      { exact: true },
    );
    await expect(savedNotice).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry same request", exact: true })).toHaveCount(
      0,
    );
    // The existing visible-page refresh recovers automatically without resending the decision.
    await expect(savedNotice).toHaveCount(0, { timeout: 30000 });
    expect(decisionRequests).toBe(1);
    expect(failedRefreshes).toBe(3);
    await expect(
      page.getByText("Defer the physical decision pending another documented check.", {
        exact: true,
      }),
    ).toBeVisible();
    const alien = await foreignContext.newPage();
    await login(alien, foreign.email, "customer");
    expect((await api(alien, { action: "load", caseId })).status).toBe(403);
    expect((await api(page, { action: "load", caseId }, "/api/investigations")).status).toBe(403);
    const legacy = await page.evaluate(async (key) => {
      const k = Object.keys(localStorage).find((k) => /^sb-.*-auth-token$/.test(k))!;
      const token = JSON.parse(localStorage.getItem(k)!).access_token;
      const r = await fetch("http://127.0.0.1:54321/rest/v1/factories?select=id", {
        headers: { apikey: key!, Authorization: `Bearer ${token}` },
      });
      return await r.json();
    }, process.env.SUPABASE_ANON_KEY);
    expect(legacy).toEqual([]);
    current = (await api(staff, { action: "load", caseId }, "/api/investigations")).body;
    const corrected = structuredClone(current.snapshot);
    corrected.periods[0].kwh += 1;
    expect(
      (
        await api(
          staff,
          {
            action: "save",
            caseId,
            expectedRevision: current.revision,
            requestKey: crypto.randomUUID(),
            snapshot: corrected,
            reason: "Correct invented source after publication",
          },
          "/api/investigations",
        )
      ).status,
    ).toBe(200);
    await page.getByRole("button", { name: "Refresh", exact: true }).click();
    await page.getByRole("button", { name: "Brief", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Your brief is being prepared" })).toBeVisible();
    await expect(page.locator("pre")).toHaveCount(0);
  } finally {
    await staffContext.close();
    await reviewerContext.close();
    await foreignContext.close();
  }
});
