import { strict as assert } from "node:assert";
import type EmbeddedPostgres from "embedded-postgres";
import { executePortalCommand } from "../src/lib/investigation/portal-service";
import { executeCaseCommand } from "../src/lib/investigation/connected-service";
import { storedCaseSchema, type CaseStore } from "../src/lib/investigation/connected-contract";
import type { PortalCase } from "../src/lib/investigation/portal-contract";

export async function verifyPortal(
  db: ReturnType<EmbeddedPostgres["getPgClient"]>,
  caseStore: CaseStore,
  owner: string,
  reviewer: string,
  outsider: string,
  factory: number,
  org: number,
) {
  const customer = "44444444-4444-4444-8444-444444444444",
    other = "55555555-5555-4555-8555-555555555555";
  await db.query(
    "insert into auth.users(id,email) values($1,'portal-customer@example.test'),($2,'portal-other@example.test')",
    [customer, other],
  );
  const store: CaseStore = {
    async call(args) {
      await db.query("begin");
      try {
        await db.query("set local role service_role");
        const r = await db.query("select public.portal_store($1,$2,$3) result", [
          args._actor,
          args._op,
          args._args,
        ]);
        await db.query("commit");
        return r.rows[0].result;
      } catch (e) {
        await db.query("rollback");
        throw e;
      }
    },
  };
  const run = (actor: string, cmd: unknown) => executePortalCommand(store, actor, cmd, org);
  const intakeId = crypto.randomUUID(),
    caseId = crypto.randomUUID();
  const submit = {
    action: "submit",
    id: intakeId,
    payload: {
      title: "Synthetic customer decision",
      question: "Which next check does the synthetic comparison support?",
      site: "Invented site",
      candidate: "C4",
      from: "2026-01-01",
      to: "2026-03-31",
    },
  };
  await run(customer, submit);
  await run(customer, submit);
  assert.equal(
    ((await run(customer, { action: "intakeList" })) as { requests: unknown[] }).requests.length,
    1,
  );
  assert.equal(
    ((await run(outsider, { action: "intakeList" })) as { requests: unknown[] }).requests.length,
    0,
  );
  await assert.rejects(
    () =>
      run(customer, {
        action: "accept",
        id: intakeId,
        caseId,
        factoryId: factory,
        autoPublish: true,
      }),
    /INTAKE_ACCESS_DENIED/,
  );
  assert.equal(
    (
      (await run(owner, {
        action: "accept",
        id: intakeId,
        caseId,
        factoryId: factory,
        autoPublish: true,
      })) as { caseId: string }
    ).caseId,
    caseId,
  );
  assert.equal(
    (
      (await run(owner, {
        action: "accept",
        id: intakeId,
        caseId: crypto.randomUUID(),
        factoryId: factory,
        autoPublish: true,
      })) as { caseId: string }
    ).caseId,
    caseId,
  );
  let view = (await run(customer, { action: "load", caseId })) as PortalCase;
  assert.equal(view.publication, null);
  assert.equal(view.role, "customer");
  await assert.rejects(() => run(other, { action: "load", caseId }), /CASE_ACCESS_DENIED/);
  await assert.rejects(
    () => executeCaseCommand(caseStore, customer, { action: "load", caseId }),
    /CASE_ACCESS_DENIED/,
  );
  await assert.rejects(
    () =>
      run(customer, { action: "publish", caseId, id: crypto.randomUUID(), expectedRevision: 1 }),
    /PUBLISH_DENIED/,
  );
  const requestId = crypto.randomUUID();
  await run(owner, {
    action: "evidence_request",
    id: requestId,
    caseId,
    evidenceId: "E01",
    text: "Provide the invented source reference and limitations.",
  });
  const reply = {
    action: "evidence_reply",
    id: crypto.randomUUID(),
    caseId,
    requestId,
    reference: "SYNTHETIC-REFERENCE",
    text: "Invented source response; not verified.",
  };
  await run(customer, reply);
  await run(customer, reply);
  view = (await run(customer, { action: "load", caseId })) as PortalCase;
  assert.equal(view.communications.filter((v) => v.kind === "evidence_reply").length, 1);
  assert.equal(view.evidence[0].verified, false);
  let current = storedCaseSchema.parse(
    await executeCaseCommand(caseStore, owner, { action: "load", caseId }),
  );
  const snapshot = structuredClone(current.snapshot);
  snapshot.expenses = [
    { id: "secret-expense", category: "other", reference: "PRIVATE-DELIVERY-MARGIN", amount: 4321 },
  ];
  snapshot.findings.push({
    id: "INTERNAL",
    type: "hypothesis",
    statement: "PRIVATE-WORKING-HYPOTHESIS",
    evidenceIds: ["E01"],
    counterEvidence: "Private challenge",
    uncertainty: "Private rationale",
    nextCheck: "Private check",
    disposition: "rejected",
  });
  current = storedCaseSchema.parse(
    await executeCaseCommand(caseStore, owner, {
      action: "save",
      caseId,
      expectedRevision: current.revision,
      requestKey: "portal-private",
      reason: "Keep internal working records separate",
      snapshot,
    }),
  );
  current = storedCaseSchema.parse(
    await executeCaseCommand(caseStore, owner, {
      action: "assign",
      caseId,
      expectedRevision: current.revision,
      requestKey: "portal-reviewer",
      userId: reviewer,
      role: "reviewer",
      active: true,
      expiresAt: null,
    }),
  );
  for (const e of current.snapshot.evidence)
    current = storedCaseSchema.parse(
      await executeCaseCommand(caseStore, owner, {
        action: "verify",
        caseId,
        expectedRevision: current.revision,
        requestKey: `portal-${e.id}`,
        evidenceId: e.id,
        basis: "Compared invented source rows against the synthetic fixture.",
      }),
    );
  const review = {
    action: "review",
    caseId,
    expectedRevision: current.revision,
    requestKey: "portal-accept-review",
    reviewer: "Assigned sample reviewer",
    competence: "Synthetic method exercise",
    scope: "Invented evidence and period arithmetic",
    decision: "accept",
    rationale: "Sample arithmetic reconciles; no physical cause or savings established.",
    dissent: "",
  };
  current = storedCaseSchema.parse(await executeCaseCommand(caseStore, reviewer, review));
  await executeCaseCommand(caseStore, reviewer, review);
  view = (await run(customer, { action: "load", caseId })) as PortalCase;
  assert(view.publication);
  assert.equal(view.publication.revision, current.revision);
  assert.equal(
    (
      await db.query("select count(*)::int n from public.case_publications where case_id=$1", [
        caseId,
      ])
    ).rows[0].n,
    1,
  );
  assert(!JSON.stringify(view).includes("PRIVATE-DELIVERY-MARGIN"));
  assert(!JSON.stringify(view).includes("PRIVATE-WORKING-HYPOTHESIS"));
  assert(!("snapshot" in view));
  assert(!("reviews" in view));
  const publicationId = view.publication.id;
  const decision = {
    action: "decision",
    id: crypto.randomUUID(),
    caseId,
    publicationId,
    decision: "deferred",
    text: "Request another documented check before acting.",
  };
  await run(customer, decision);
  await db.query("begin");
  try {
    await db.query("set local role authenticated");
    await db.query("select set_config('request.jwt.claim.sub',$1,true)", [customer]);
    assert.equal((await db.query("select id from public.factories")).rowCount, 0);
    await assert.rejects(
      () => db.query("select * from public.case_publications"),
      /permission denied/,
    );
  } finally {
    await db.query("rollback");
  }
  const correction = structuredClone(current.snapshot);
  correction.periods[0].kwh += 1;
  current = storedCaseSchema.parse(
    await executeCaseCommand(caseStore, owner, {
      action: "save",
      caseId,
      expectedRevision: current.revision,
      requestKey: "portal-correction",
      snapshot: correction,
      reason: "Correct invented source quantity",
    }),
  );
  view = (await run(customer, { action: "load", caseId })) as PortalCase;
  assert.equal(view.publication, null);
  // Retry returns the existing receipt even though a new decision is no longer allowed.
  await run(customer, decision);
  await assert.rejects(
    () =>
      run(customer, {
        action: "decision",
        id: crypto.randomUUID(),
        caseId,
        publicationId,
        decision: "accepted",
        text: "Attempt using an obsolete publication",
      }),
    /CURRENT_PUBLICATION_REQUIRED/,
  );
  await run(owner, { action: "grant", caseId, userId: customer, active: false, expiresAt: null });
  await assert.rejects(() => run(customer, { action: "load", caseId }), /CASE_ACCESS_DENIED/);
  console.log(
    "PASS portal intake/acceptance, case-only access, shared evidence, protected projection, atomic automatic publication, stale release refusal and revocation; zero customer factory membership",
  );
}
