import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import type EmbeddedPostgres from "embedded-postgres";
import {
  executeAirCommand,
  airStoredSchema,
  type AirCommand,
} from "../src/lib/compressed-air/connected";
import { executeCaseCommand } from "../src/lib/investigation/connected-service";
import { storedCaseSchema, type CaseStore } from "../src/lib/investigation/connected-contract";

export async function verifyCompressedAir(
  db: ReturnType<EmbeddedPostgres["getPgClient"]>,
  cases: CaseStore,
  owner: string,
  reviewer: string,
  outsider: string,
  factory: number,
) {
  await db.query("update public.organization_members set status='active' where user_id=$1", [
    owner,
  ]);
  const caseId = crypto.randomUUID();
  let parent = storedCaseSchema.parse(
    await executeCaseCommand(cases, owner, {
      action: "create",
      caseId,
      factoryId: factory,
      candidate: "C1",
      requestKey: "air-parent",
    }),
  );
  const assign = async (active: boolean, expiresAt: string | null = null) => {
    parent = storedCaseSchema.parse(
      await executeCaseCommand(cases, owner, {
        action: "assign",
        caseId,
        expectedRevision: parent.revision,
        requestKey: crypto.randomUUID(),
        userId: reviewer,
        role: "reviewer",
        active,
        expiresAt,
      }),
    );
  };
  await assign(true);
  const asset = Number(
    (
      await db.query(
        "insert into public.factory_assets(factory_id,name) values($1,'Synthetic compressor') returning id",
        [factory],
      )
    ).rows[0].id,
  );
  const store: CaseStore = {
    async call(args) {
      await db.query("begin");
      try {
        await db.query("set local role service_role");
        const keys = [
          "_actor",
          "_op",
          "_case",
          "_expected",
          "_key",
          "_fingerprint",
          "_snapshot",
          "_event",
        ];
        const result = await db.query(
          "select public.compressed_air_store($1,$2,$3,$4,$5,$6,$7,$8) result",
          keys.map((k) => args[k] ?? (k === "_event" ? {} : null)),
        );
        await db.query("commit");
        return result.rows[0].result;
      } catch (e) {
        await db.query("rollback");
        throw e;
      }
    },
  };
  const run = (actor: string, cmd: AirCommand) => executeAirCommand(store, actor, cmd);
  await assert.rejects(() => run(owner, { action: "load", caseId }), /COMPRESSED_AIR_DISABLED/);
  await db.query("update private.compressed_air_gate set enabled=true");
  await assert.rejects(() => run(outsider, { action: "scope", caseId }), /CASE_ACCESS_DENIED/);
  assert.equal(airStoredSchema.parse(await run(owner, { action: "load", caseId })).revision, 0);
  const csv = await readFile(
    new URL("../data/compressed-air/synthetic.csv", import.meta.url),
    "utf8",
  );
  const imp = {
    action: "import" as const,
    caseId,
    expectedRevision: 0,
    requestKey: "air-import",
    assetId: asset,
    sourceName: "synthetic.csv",
    csv,
  };
  await assert.rejects(
    () => run(owner, { ...imp, csv: csv.replace("pressure_bar", "pressure_psi") }),
    /AIR_INVALID_CSV/,
  );
  assert.equal(airStoredSchema.parse(await run(owner, { action: "load", caseId })).revision, 0);
  const foreignAsset = Number(
    (await db.query("select id from public.factory_assets where factory_id<>$1 limit 1", [factory]))
      .rows[0]?.id ?? 99999999,
  );
  await assert.rejects(() => run(owner, { ...imp, assetId: foreignAsset }), /CASE_ACCESS_DENIED/);
  const imported = airStoredSchema.parse(await run(owner, imp));
  assert.equal(imported.revision, 1);
  assert.equal(imported.snapshot!.dataset.scope.siteId, String(factory));
  // Lost response: identical request returns original receipt; changed bytes conflict.
  assert.deepEqual(airStoredSchema.parse(await run(owner, imp)).snapshot, imported.snapshot);
  await assert.rejects(() => run(owner, { ...imp, csv: csv + "\n" }), /IDEMPOTENCY_CONFLICT/);
  await assert.rejects(
    () => run(reviewer, { ...imp, expectedRevision: 1, requestKey: "reviewer-import" }),
    /CASE_EDIT_DENIED/,
  );
  const common = (expectedRevision: number) => ({
    caseId,
    expectedRevision,
    requestKey: crypto.randomUUID(),
  });
  const hash = imported.snapshot!.datasetHash;
  const review = {
    action: "review" as const,
    ...common(1),
    datasetHash: hash,
    decision: "accept" as const,
    competence: "Synthetic engineer role; professional validation pending",
    rationale: "Software fixture checked, not industrial validation",
    confounders: "Meter bases and causal confounders remain unvalidated",
    findings: [
      {
        statement: "Source interval observed in invented fixture",
        sourceLines: [2],
        uncertainty: "Declared uncertainty is synthetic and unvalidated",
      },
    ],
  };
  await assert.rejects(() => run(owner, review), /INDEPENDENT_REVIEWER_REQUIRED/);
  await assert.rejects(
    () => run(reviewer, { ...review, findings: [{ ...review.findings[0], sourceLines: [99999] }] }),
    /AIR_UNRESOLVED_SOURCE_LINE/,
  );
  const reviewed = airStoredSchema.parse(await run(reviewer, review));
  assert.equal(reviewed.snapshot!.review!.actorId, reviewer);
  // Grant revocation blocks historical reads AND retry receipts, not just mutations.
  await assign(false);
  await assert.rejects(() => run(reviewer, review), /CASE_ACCESS_DENIED/);
  await assert.rejects(
    () => run(reviewer, { action: "load", caseId, revision: 1 }),
    /CASE_ACCESS_DENIED/,
  );
  await assign(true, "2020-01-01T00:00:00Z");
  await assert.rejects(() => run(reviewer, { action: "scope", caseId }), /CASE_ACCESS_DENIED/);
  await assign(true);
  const actionId = crypto.randomUUID();
  await run(owner, {
    action: "propose",
    ...common(2),
    datasetHash: hash,
    id: actionId,
    owner: "Fictional customer action owner",
    description: "Read-only check of synthetic measurement context",
  });
  await assert.rejects(
    () =>
      run(owner, {
        action: "complete",
        ...common(3),
        datasetHash: hash,
        id: actionId,
        completionEvidence: "Invented completion evidence reference",
      }),
    /AIR_APPROVAL_REQUIRED/,
  );
  await run(owner, {
    action: "approve",
    ...common(3),
    datasetHash: hash,
    id: actionId,
    customerApproval: "SIMULATED customer authorization reference only",
  });
  await run(owner, {
    action: "complete",
    ...common(4),
    datasetHash: hash,
    id: actionId,
    completionEvidence: "SIMULATED completion reference; no measured saving",
  });
  await run(owner, {
    action: "verifyOutcome",
    ...common(5),
    datasetHash: hash,
    confounders: "Synthetic measurement assumptions and causal confounders remain unresolved",
    rationale: "Descriptive matched intervals only; no verified savings",
  });
  const exportCmd = { action: "export" as const, ...common(6) };
  const exported = await run(owner, exportCmd);
  assert("report" in exported);
  assert.equal(exported.report.verifiedSavings, null);
  assert.equal(exported.report.outcomeVerification!.outcome, "inconclusive");
  assert.equal(
    exported.report.outcomeVerification!.descriptiveEvidence,
    "matched_intervals_available",
  );
  assert.equal(exported.report.actions[0].status, "completed");
  assert.equal(exported.report.exportedBy, owner);
  assert.equal(exported.report.revision, 7);
  assert.deepEqual(((await run(owner, exportCmd)) as typeof exported).report, exported.report);
  const reimported = airStoredSchema.parse(
    await run(owner, {
      ...imp,
      ...common(7),
      csv: csv.replaceAll("product-a-loaded", "product-b-loaded"),
    }),
  );
  assert.equal(reimported.snapshot!.review, null);
  assert.equal(reimported.snapshot!.verification, null);
  assert.notEqual(reimported.snapshot!.datasetHash, hash);
  await assert.rejects(() => run(reviewer, { ...review, ...common(8) }), /AIR_STALE_REVIEW/);
  assert.deepEqual(reimported.snapshot!.actions, []);
  await assert.rejects(() => run(reviewer, { ...review, ...common(7) }), /STALE_CASE_REVISION/);
  const old = airStoredSchema.parse(await run(owner, { action: "load", caseId, revision: 7 }));
  assert.equal(old.snapshot!.actions[0].status, "completed");
  assert.equal(old.headRevision, 8);
  // Original parent evaluation is independent; attaching interval data never edits C1/C4 fields.
  assert.deepEqual(
    storedCaseSchema.parse(await executeCaseCommand(cases, owner, { action: "load", caseId }))
      .snapshot,
    parent.snapshot,
  );
  await db.query("update public.organization_members set status='suspended' where user_id=$1", [
    owner,
  ]);
  await assert.rejects(() => run(owner, exportCmd), /CASE_ACCESS_DENIED/);
  await db.query("update public.organization_members set status='active' where user_id=$1", [
    owner,
  ]);
  for (const role of ["anon", "authenticated", "service_role"]) {
    await db.query("begin");
    try {
      await db.query(`set local role ${role}`);
      await assert.rejects(
        () => db.query("select * from public.compressed_air_revisions"),
        /permission denied/,
      );
    } finally {
      await db.query("rollback");
    }
  }
  await assert.rejects(
    () =>
      db.query("update public.compressed_air_revisions set event='export' where case_id=$1", [
        caseId,
      ]),
    /IMMUTABLE/,
  );
  await assert.rejects(
    () => db.query("delete from public.compressed_air_revisions where case_id=$1", [caseId]),
    /IMMUTABLE/,
  );
  await db.query("begin");
  try {
    await db.query("set local role authenticated");
    await assert.rejects(
      () => db.query("select public.compressed_air_store($1,'read',$2)", [owner, caseId]),
      /permission denied/,
    );
  } finally {
    await db.query("rollback");
  }
  console.log(
    "PASS compressed air: disabled gate, tenant/role/revocation/expiry denials, import/retry/source conflict, independent review, approval/completion, immutable export custody, save/reload and parent preservation",
  );
}
