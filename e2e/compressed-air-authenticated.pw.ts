import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { requireLocalOnlyRequests } from "./nonproduction-network";
import { provisionLocalReviewer } from "./local-backend";

async function login(page: Page, email: string) {
  await requireLocalOnlyRequests(page.context());
  await page.goto("/investigations-connected");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill("gridmind-ci-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("button", { name: "Load my cases", exact: true })).toBeVisible();
}
async function api(page: Page, command: Record<string, unknown>, air = true) {
  return page.evaluate(
    async ({ command, air }) => {
      const key = Object.keys(localStorage).find((k) => /^sb-.*-auth-token$/.test(k))!;
      const session = JSON.parse(localStorage.getItem(key)!);
      const response = await fetch(`/api/investigations${air ? "?method=compressed-air" : ""}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(command),
      });
      return { status: response.status, body: await response.json() };
    },
    { command, air },
  );
}
test("isolated compressed-air: import recovery, reviewer, action, outcome, export and tenant denial", async ({
  page,
  browser,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await login(page, "gridmind-http-a@example.test");
  const created = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/investigations") && r.request().postDataJSON()?.action === "create",
  );
  await page.getByRole("button", { name: "Create synthetic case", exact: true }).click();
  const parent = await (await created).json();
  const caseId = parent.caseId as string;
  const section = page
    .locator("section")
    .filter({
      has: page.getByRole("heading", { name: "Compressed-air evidence attachment", exact: true }),
    });
  await section.getByRole("button", { name: "Load compressed-air evidence", exact: true }).click();
  await expect(section.getByText("Revision 0 / 0 · manager", { exact: true })).toBeVisible();
  let dropped = false;
  const requests: string[] = [];
  await page.route("**/api/investigations?method=compressed-air", async (route) => {
    if (route.request().postDataJSON()?.action === "import") {
      requests.push(route.request().postData()!);
      if (!dropped) {
        dropped = true;
        expect((await route.fetch()).ok()).toBe(true);
        return route.abort("failed");
      }
    }
    return route.continue();
  });
  await section.getByRole("button", { name: "Append synthetic import", exact: true }).click();
  await expect(section.getByText("Revision 1 / 1 · manager", { exact: true })).toBeVisible();
  expect(requests).toHaveLength(2);
  expect(requests[0]).toBe(requests[1]);
  await page.unroute("**/api/investigations?method=compressed-air");
  const imported = await api(page, { action: "load", caseId });
  expect(imported.status).toBe(200);
  const datasetHash = imported.body.snapshot.datasetHash;
  const scope = await api(page, { action: "scope", caseId });
  const fixture = await provisionLocalReviewer(parent.factoryId, Number(scope.body.organizationId));
  const assigned = await api(
    page,
    {
      action: "assign",
      caseId,
      expectedRevision: parent.revision,
      requestKey: crypto.randomUUID(),
      userId: fixture.id,
      role: "reviewer",
      active: true,
      expiresAt: null,
    },
    false,
  );
  expect(assigned.status).toBe(200);
  const reviewerContext = await browser.newContext();
  const otherContext = await browser.newContext();
  try {
    const rp = await reviewerContext.newPage();
    await login(rp, fixture.email);
    const review = {
      action: "review",
      caseId,
      expectedRevision: 1,
      requestKey: crypto.randomUUID(),
      datasetHash,
      decision: "accept",
      competence: "Synthetic compressed-air reviewer; qualification pending",
      rationale: "Synthetic intervals assessed without industrial validation",
      confounders: "Pressure and flow bases remain unvalidated",
      findings: [
        {
          statement: "Source supports an invented power comparison",
          sourceLines: [5],
          uncertainty: "Synthetic uncertainty declaration only",
        },
      ],
    };
    expect((await api(page, review)).status).toBe(403);
    expect((await api(rp, review)).status).toBe(200);
    const common = (expectedRevision: number) => ({
      caseId,
      expectedRevision,
      requestKey: crypto.randomUUID(),
      datasetHash,
    });
    const id = crypto.randomUUID();
    expect(
      (
        await api(page, {
          action: "propose",
          ...common(2),
          id,
          owner: "Invented customer action owner",
          description: "Read-only verification of invented measurements",
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await api(page, {
          action: "complete",
          ...common(3),
          id,
          completionEvidence: "Synthetic completion evidence reference",
        })
      ).status,
    ).toBe(409);
    expect(
      (
        await api(page, {
          action: "approve",
          ...common(3),
          id,
          customerApproval: "SIMULATED customer approval reference",
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await api(page, {
          action: "complete",
          ...common(4),
          id,
          completionEvidence: "Synthetic completion evidence reference",
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await api(page, {
          action: "verifyOutcome",
          ...common(5),
          confounders: "Unvalidated causal and measurement assumptions",
          rationale: "Descriptive comparison only, no causal saving established",
        })
      ).status,
    ).toBe(200);
    await page.reload();
    await page.getByRole("button", { name: "Load my cases", exact: true }).click();
    await page.getByRole("button", { name: new RegExp(`^${caseId.slice(0, 8)} ·`) }).click();
    await section
      .getByRole("button", { name: "Load compressed-air evidence", exact: true })
      .click();
    await expect(section.getByText("Revision 6 / 6 · manager", { exact: true })).toBeVisible();
    await expect(section.getByText(/Outcome: inconclusive/)).toBeVisible();
    const download = page.waitForEvent("download");
    await section
      .getByRole("button", { name: "Export source-bound report and custody receipt", exact: true })
      .click();
    const file = await download;
    const report = JSON.parse(await readFile((await file.path())!, "utf8"));
    expect(report.verifiedSavings).toBeNull();
    expect(report.outcomeVerification.outcome).toBe("inconclusive");
    expect(report.engineerReview.actorId).toBe(fixture.id);
    expect(report.revision).toBe(7);
    expect(report.snapshotSha256).toMatch(/^[a-f0-9]{64}$/);
    const other = await otherContext.newPage();
    await login(other, "gridmind-http-b@example.test");
    for (const command of [
      { action: "scope", caseId },
      { action: "load", caseId },
      { action: "load", caseId, revision: 1 },
    ])
      expect((await api(other, command)).status).toBe(403);
    const revoke = await api(
      page,
      {
        action: "assign",
        caseId,
        expectedRevision: assigned.body.revision,
        requestKey: crypto.randomUUID(),
        userId: fixture.id,
        role: "reviewer",
        active: false,
        expiresAt: null,
      },
      false,
    );
    expect(revoke.status).toBe(200);
    expect((await api(rp, review)).status).toBe(403);
    expect((await api(rp, { action: "load", caseId })).status).toBe(403);
    expect((await api(page, { action: "load", caseId }, false)).body.snapshot).toEqual(
      revoke.body.snapshot,
    );
    expect(errors).toEqual([]);
  } finally {
    await reviewerContext.close();
    await otherContext.close();
  }
});
