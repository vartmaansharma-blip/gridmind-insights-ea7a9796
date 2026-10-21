import { test, expect, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { localBackend, provisionLocalReviewer } from "./local-backend";
import { requireLocalOnlyRequests } from "./nonproduction-network";
function localSql(sql: string) {
  const status = execFileSync("supabase", ["status", "-o", "env"], {
    cwd: new URL("../", import.meta.url),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  const db = status.match(/^DB_URL="([^"]+)"$/m)?.[1];
  if (!db || new URL(db).hostname !== "127.0.0.1" || new URL(db).port !== "54322")
    throw new Error("Core acceptance requires disposable loopback database");
  execFileSync("psql", [db, "-v", "ON_ERROR_STOP=1"], {
    input: sql,
    stdio: ["pipe", "ignore", "pipe"],
  });
}
async function login(page: Page, email: string) {
  await requireLocalOnlyRequests(page.context());
  await page.goto("/auth?destination=team");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill("gridmind-ci-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL((u) => u.pathname !== "/auth");
  await page.goto("/investigations");
}
async function core(page: Page, body: Record<string, unknown>) {
  return page.evaluate(async (command) => {
    const key = Object.keys(localStorage).find((k) => /^sb-.*-auth-token$/.test(k));
    const token = key ? JSON.parse(localStorage.getItem(key)!).access_token : null;
    if (!token) throw new Error("Missing disposable Auth session");
    const response = await fetch("/api/industrial-core", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(command),
    });
    return { status: response.status, body: await response.json() };
  }, body);
}
test("core persists a reviewed decision through real Auth/HTTP, denies foreign tenant and revoked authority", async ({
  page,
  browser,
}) => {
  const local = localBackend();
  const response = await fetch(
    `${local.origin}/rest/v1/factories?name=eq.gridmind-http-factory-a&select=id,organization_id`,
    { headers: { apikey: local.serviceKey, Authorization: `Bearer ${local.serviceKey}` } },
  );
  const rows = await response.json();
  expect(response.ok).toBe(true);
  expect(rows).toHaveLength(1);
  const factory = Number(rows[0].id),
    org = Number(rows[0].organization_id);
  if (!Number.isSafeInteger(factory) || !Number.isSafeInteger(org))
    throw new Error("Invalid fixture scope");
  const reviewer = await provisionLocalReviewer(factory, org);
  if (!/^[a-f0-9-]{36}$/.test(reviewer.id)) throw new Error("Invalid reviewer UUID");
  localSql(`update private.industrial_core_gate set enabled=true;
 insert into private.industrial_core_authorities(organization_id,factory_id,user_id,capability,expires_at,granted_by,basis)
 select ${org},${factory},u.id,c,now()+interval '1 day',u.id,'Isolated HTTP synthetic fixture, not professional authority' from auth.users u cross join unnest(array['read','edit']) c where u.email='gridmind-http-a@example.test';
 insert into private.industrial_core_authorities(organization_id,factory_id,user_id,capability,expires_at,granted_by,basis)
 select ${org},${factory},'${reviewer.id}'::uuid,c,now()+interval '1 day','${reviewer.id}'::uuid,'Independent isolated synthetic fixture, not professional authority' from unnest(array['read','edit','commercial','quality','safety','finance','sharing']) c;`);
  const reviewerContext = await browser.newContext(),
    foreignContext = await browser.newContext();
  try {
    await login(page, "gridmind-http-a@example.test");
    const region = page.getByRole("region", { name: "Industrial decisions and constraints" });
    await region.getByText("Isolated authenticated workspace", { exact: true }).click();
    await region.getByLabel("Core plant ID").fill(String(factory));
    const workspaceId = crypto.randomUUID();
    await region.getByLabel("Core workspace UUID").fill(workspaceId);
    const createdResponse = page.waitForResponse(
      (r) => r.url().endsWith("/api/industrial-core") && r.request().method() === "POST",
      { timeout: 15_000 },
    );
    await region.getByRole("button", { name: "Create synthetic workspace", exact: true }).click();
    const created = await createdResponse.catch(async () => {
      console.error("Core creation visible synthetic state:", await region.innerText());
      throw new Error("No core HTTP response after create; inspect synthetic UI state");
    });
    // Log only the API's stable error category on failure, never session/request data.
    const category = created.ok() ? "ok" : String((await created.json()).error);
    expect(created.status(), `Workspace create: ${category}`).toBe(200);
    await expect(region.getByText(/Saved revision 1;/)).toBeVisible();
    const base = { workspaceId, factoryId: factory };
    const reviewPage = await reviewerContext.newPage();
    await login(reviewPage, reviewer.email);
    expect(
      (
        await core(page, {
          ...base,
          action: "verify_input",
          expectedRevision: 1,
          requestKey: "forged-self-verification",
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await core(reviewPage, {
          ...base,
          action: "verify_input",
          expectedRevision: 1,
          requestKey: "verify",
        })
      ).status,
    ).toBe(200);
    const evaluated = await core(page, {
      ...base,
      action: "evaluate",
      expectedRevision: 2,
      requestKey: "evaluate",
    });
    expect(evaluated.status).toBe(200);
    expect(evaluated.body.snapshot.evaluation.recommendation).toBe("produce-approved");
    expect(
      (
        await core(page, {
          ...base,
          action: "request_approval",
          expectedRevision: 3,
          requestKey: "request",
          actionId: "produce-approved",
          kind: "order_acceptance",
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await core(reviewPage, {
          ...base,
          action: "approve",
          expectedRevision: 4,
          requestKey: "approve",
        })
      ).status,
    ).toBe(200);
    localSql(
      `delete from private.industrial_core_authorities where user_id='${reviewer.id}' and capability='safety';`,
    );
    expect(
      (
        await core(page, {
          ...base,
          action: "execute",
          expectedRevision: 5,
          requestKey: "denied-revoked",
        })
      ).status,
    ).toBe(403);
    localSql(
      `insert into private.industrial_core_authorities values(${org},${factory},'${reviewer.id}','safety',now()+interval '1 day','${reviewer.id}','Restored only for isolated acceptance');`,
    );
    const execute = { ...base, action: "execute", expectedRevision: 5, requestKey: "execute" };
    const executed = await core(page, execute);
    expect(executed.status).toBe(200);
    expect(executed.body.snapshot.workflow.phase).toBe("completed");
    expect(executed.body.snapshot.workflow.result).toBe("unverified");
    const retry = await core(page, execute);
    expect(retry.status).toBe(200);
    expect(retry.body.revision).toBe(6);
    expect(retry.body.snapshot).toEqual(executed.body.snapshot);
    expect(retry.body.audit).toHaveLength(6);
    await region.getByRole("button", { name: "Load saved workspace", exact: true }).click();
    await expect(region.getByText(/Saved revision 6;/)).toBeVisible();
    const operatingBase = { workspaceId: crypto.randomUUID(), factoryId: factory };
    const operatingCreated = await core(page, { ...operatingBase, action: "create_operations", scenario: "normal", expectedRevision: 0, requestKey: "create-operating" });
    expect(operatingCreated.status).toBe(200);
    expect(operatingCreated.body.snapshot.operations.evaluation).toBeNull();
    expect((await core(reviewPage, { ...operatingBase, action: "verify_input", expectedRevision: 1, requestKey: "review-operating" })).status).toBe(200);
    const savedPlan = await core(page, { ...operatingBase, action: "plan_operations", specification: operatingCreated.body.snapshot.operations.specification, expectedRevision: 2, requestKey: "save-operating-plan" });
    expect(savedPlan.status).toBe(200);
    expect(savedPlan.body.snapshot.operations.evaluation.status).toBe("candidate_feasible");
    expect(savedPlan.body.snapshot.workflow).toBeNull();
    await region.getByLabel("Core workspace UUID").fill(operatingBase.workspaceId);
    await region.getByRole("button", { name: "Load saved workspace", exact: true }).click();
    await expect(region.getByText("Planning result: Feasible draft within supplied records", { exact: true })).toBeVisible();
    await expect(region.getByRole("row", { name: /work-order-second operation press/ })).toBeVisible();
    expect((await core(page, { ...operatingBase, action: "load" })).body.snapshot.operations).toEqual(savedPlan.body.snapshot.operations);
    const other = await foreignContext.newPage();
    await login(other, "gridmind-http-b@example.test");
    expect((await core(other, { ...base, action: "load" })).status).toBe(403);
    expect((await core(other, { ...operatingBase, action: "load" })).status).toBe(403);
    localSql(
      `delete from private.industrial_core_authorities where factory_id=${factory} and user_id in(select id from auth.users where email='gridmind-http-a@example.test');`,
    );
    expect((await core(page, { ...base, action: "load" })).status).toBe(403);
  } finally {
    try {
      await Promise.allSettled([reviewerContext.close(), foreignContext.close()]);
    } finally {
      localSql("update private.industrial_core_gate set enabled=false;");
    }
  }
});
