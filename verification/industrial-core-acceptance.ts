import { strict as assert } from "node:assert";
import type { Client } from "pg";
import { executeCoreCommand, type CoreStore } from "../src/lib/industrial-core/service";
import { fixture } from "../src/lib/industrial-core/fixtures";

/** Real PostgreSQL RLS/RPC/CAS + TypeScript service; Auth/session rows are native fixtures, not HTTP proof. */
export async function verifyIndustrialCore(db: Client, second: Client) {
  const owner = "f0000001-1111-4111-8111-111111111111",
    reviewer = "f0000002-1111-4111-8111-111111111111",
    outsider = "f0000003-1111-4111-8111-111111111111";
  const ownerSession = "f0000004-1111-4111-8111-111111111111",
    reviewSession = "f0000005-1111-4111-8111-111111111111",
    otherSession = "f0000006-1111-4111-8111-111111111111";
  await db.query(
    "insert into auth.users(id,email) values($1,'core-author@example.test'),($2,'core-review@example.test'),($3,'core-other@example.test')",
    [owner, reviewer, outsider],
  );
  await db.query("insert into auth.sessions(id,user_id) values($1,$4),($2,$5),($3,$6)", [
    ownerSession,
    reviewSession,
    otherSession,
    owner,
    reviewer,
    outsider,
  ]);
  const organizations = await db.query(
    "insert into public.organizations(name) values('CORE-SYN-A'),('CORE-SYN-B') returning id",
  );
  const [a, b] = organizations.rows.map((r) => Number(r.id));
  const factories = await db.query(
    "insert into public.factories(name,organization_id) values('CORE-SYN-A',$1),('CORE-SYN-B',$2) returning id",
    [a, b],
  );
  const [fa, fb] = factories.rows.map((r) => Number(r.id));
  await db.query(
    "insert into public.organization_members(organization_id,user_id,role,status) values($1,$3,'owner','active'),($1,$4,'admin','active'),($2,$5,'owner','active')",
    [a, b, owner, reviewer, outsider],
  );
  await db.query(
    "insert into public.factory_members(factory_id,user_id,organization_id,role) values($1,$3,$6,'owner'),($1,$4,$6,'admin'),($2,$5,$7,'owner')",
    [fa, fb, owner, reviewer, outsider, a, b],
  );
  const storeFor = (connection: Client): CoreStore => ({
    async call(args) {
      const names = [
        "_op",
        "_actor",
        "_session",
        "_factory",
        "_workspace",
        "_expected",
        "_key",
        "_fingerprint",
        "_snapshot",
        "_event",
      ];
      await connection.query("begin");
      try {
        await connection.query("set local role service_role");
        const row = await connection.query(
          "select public.industrial_core_store($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) result",
          names.map((k) => args[k] ?? (k === "_event" ? {} : null)),
        );
        await connection.query("commit");
        return row.rows[0].result;
      } catch (e) {
        await connection.query("rollback");
        throw e;
      }
    },
  });
  const store = storeFor(db),
    workspace = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  const base = { workspaceId: workspace, factoryId: fa };
  const command = (actor: string, session: string, args: Record<string, unknown>) =>
    executeCoreCommand(store, actor, session, { ...base, ...args });
  await assert.rejects(() => command(owner, ownerSession, { action: "load" }), /CORE_DISABLED/);
  await db.query("update private.industrial_core_gate set enabled=true");
  await assert.rejects(
    () => command(owner, ownerSession, { action: "load" }),
    /CORE_ACCESS_DENIED/,
  ); // owner is not decision authority
  await db.query(
    "insert into private.industrial_core_authorities(organization_id,factory_id,user_id,capability,expires_at,granted_by,basis) select $1,$2,$3,c,now()+interval '1 day',$3,'Disposable synthetic test authorization' from unnest(array['read','edit']) c",
    [a, fa, owner],
  );
  await db.query(
    "insert into private.industrial_core_authorities(organization_id,factory_id,user_id,capability,expires_at,granted_by,basis) select $1,$2,$3,c,now()+interval '1 day',$4,'Independent disposable synthetic test authorization' from unnest(array['read','edit','commercial','quality','safety','finance','sharing']) c",
    [a, fa, reviewer, owner],
  );
  let current = await command(owner, ownerSession, {
    action: "create",
    expectedRevision: 0,
    requestKey: "core-create",
    scenario: "A",
  });
  assert.equal(current.revision, 1);
  assert(current.snapshot!.input.constraints.every((r) => r.verification === "proposed"));
  assert.equal(
    (
      await command(owner, ownerSession, {
        action: "create",
        expectedRevision: 0,
        requestKey: "core-create",
        scenario: "A",
      })
    ).revision,
    1,
  );
  await assert.rejects(
    () =>
      command(owner, ownerSession, {
        action: "create",
        expectedRevision: 0,
        requestKey: "core-create",
        scenario: "D",
      }),
    /CORE_IDEMPOTENCY_CONFLICT/,
  );
  await assert.rejects(
    () =>
      command(owner, ownerSession, {
        action: "verify_input",
        expectedRevision: 1,
        requestKey: "self-verify",
      }),
    /CORE_INDEPENDENT_REVIEWER_REQUIRED/,
  );
  await assert.rejects(
    () => command(outsider, otherSession, { action: "load" }),
    /CORE_ACCESS_DENIED/,
  );
  await assert.rejects(
    () => executeCoreCommand(store, owner, otherSession, { ...base, action: "load" }),
    /CORE_SESSION_DENIED/,
  );
  await assert.rejects(
    () =>
      executeCoreCommand(store, owner, ownerSession, { ...base, factoryId: fb, action: "load" }),
    /CORE_ACCESS_DENIED/,
  );
  current = await command(reviewer, reviewSession, {
    action: "verify_input",
    expectedRevision: 1,
    requestKey: "verify-1",
  });
  current = await command(owner, ownerSession, {
    action: "evaluate",
    expectedRevision: 2,
    requestKey: "evaluate-1",
  });
  assert.equal(current.snapshot!.evaluation!.recommendation, "produce-approved");
  current = await command(owner, ownerSession, {
    action: "request_approval",
    expectedRevision: 3,
    requestKey: "request-1",
    actionId: "produce-approved",
    kind: "order_acceptance",
  });
  await assert.rejects(
    () =>
      command(owner, ownerSession, {
        action: "approve",
        expectedRevision: 4,
        requestKey: "self-approve",
      }),
    /CORE_INDEPENDENT_APPROVER_REQUIRED/,
  );
  current = await command(reviewer, reviewSession, {
    action: "approve",
    expectedRevision: 4,
    requestKey: "approve-1",
  });
  await db.query(
    "delete from private.industrial_core_authorities where user_id=$1 and capability='safety'",
    [reviewer],
  );
  await assert.rejects(
    () =>
      command(owner, ownerSession, {
        action: "execute",
        expectedRevision: 5,
        requestKey: "revoked-authority",
      }),
    /CORE_APPROVAL_AUTHORITY_REVOKED/,
  );
  await db.query(
    "insert into private.industrial_core_authorities values($1,$2,$3,'safety',now()+interval '1 day',$4,'Restored only for synthetic acceptance')",
    [a, fa, reviewer, owner],
  );
  current = await command(owner, ownerSession, {
    action: "execute",
    expectedRevision: 5,
    requestKey: "execute-1",
  });
  assert.equal(current.snapshot!.workflow!.phase, "completed");
  assert.equal(current.snapshot!.workflow!.result, "unverified");
  assert.equal(
    (
      await command(owner, ownerSession, {
        action: "execute",
        expectedRevision: 5,
        requestKey: "execute-1",
      })
    ).revision,
    6,
  );
  await assert.rejects(
    () =>
      command(reviewer, reviewSession, {
        action: "record_outcome",
        expectedRevision: 6,
        requestKey: "old-outcome",
        evidenceId: "source",
      }),
    /CORE_OUTCOME_EVIDENCE_REQUIRED/,
  );
  const replacement = fixture("A", a, fa);
  replacement.sourceId = "import-corrected";
  replacement.entities.find((e) => e.id === "shift")!.attributes.availableMinutes = 20;
  current = await command(owner, ownerSession, {
    action: "replace_input",
    expectedRevision: 6,
    requestKey: "replace-1",
    input: replacement,
  });
  await assert.rejects(
    () =>
      command(owner, ownerSession, {
        action: "replace_input",
        expectedRevision: 7,
        requestKey: "duplicate-source",
        input: replacement,
      }),
    /CORE_DUPLICATE_SOURCE/,
  );
  assert.equal(current.snapshot!.workflow, null);
  assert.equal(current.snapshot!.evaluation, null);
  await assert.rejects(
    () =>
      command(owner, ownerSession, {
        action: "execute",
        expectedRevision: 7,
        requestKey: "stale-execute",
      }),
    /CORE_EVALUATION_REQUIRED/,
  );
  const snapshots = await db.query(
    "select revision,actor_id,event,snapshot_sha256,entry_sha256 from public.industrial_core_revisions where workspace_id=$1 order by revision",
    [workspace],
  );
  assert.equal(snapshots.rows.length, 7);
  assert(
    snapshots.rows.every(
      (r) =>
        r.actor_id &&
        r.event.kind &&
        r.event.inputDigest &&
        r.event.requestKey &&
        r.entry_sha256.length === 64,
    ),
  );
  await assert.rejects(
    () =>
      db.query("update public.industrial_core_revisions set event='{}' where workspace_id=$1", [
        workspace,
      ]),
    /CORE_HISTORY_IMMUTABLE/,
  );
  await db.query("begin; set local role authenticated");
  await db.query("select set_config('request.jwt.claims',$1,true)", [
    JSON.stringify({ sub: owner, session_id: ownerSession, is_anonymous: false }),
  ]);
  assert.equal(
    (await db.query("select count(*)::int n from public.industrial_core_workspaces")).rows[0].n,
    1,
  );
  await assert.rejects(
    () =>
      db.query("update public.industrial_core_workspaces set revision=99 where id=$1", [workspace]),
    /permission denied/,
  );
  await db.query("rollback");
  await db.query("begin; set local role authenticated");
  await db.query("select set_config('request.jwt.claims',$1,true)", [
    JSON.stringify({ sub: outsider, session_id: otherSession, is_anonymous: false }),
  ]);
  assert.equal(
    (await db.query("select count(*)::int n from public.industrial_core_workspaces")).rows[0].n,
    0,
  );
  await assert.rejects(
    () =>
      db.query("select public.industrial_core_store('load',$1,$2,$3,$4)", [
        owner,
        ownerSession,
        fa,
        workspace,
      ]),
    /permission denied/,
  );
  await db.query("rollback");
  // Genuine PostgreSQL two-connection CAS. Exactly one stale input can append.
  const [left, right] = await Promise.allSettled([
    command(owner, ownerSession, { action: "evaluate", expectedRevision: 7, requestKey: "race-a" }),
    executeCoreCommand(storeFor(second), owner, ownerSession, {
      ...base,
      action: "evaluate",
      expectedRevision: 7,
      requestKey: "race-b",
    }),
  ]);
  assert.equal([left, right].filter((r) => r.status === "fulfilled").length, 1);
  assert(
    [left, right].some(
      (r) => r.status === "rejected" && /CORE_VERSION_CONFLICT/.test(String(r.reason)),
    ),
  );
  let dropReceipt = true;
  const dropped: CoreStore = {
    async call(args) {
      const result = await store.call(args);
      if (args._op === "append" && dropReceipt) {
        dropReceipt = false;
        throw new Error("SIMULATED_LOST_RECEIPT");
      }
      return result;
    },
  };
  const retry = { ...base, action: "evaluate", expectedRevision: 8, requestKey: "lost-receipt" };
  await assert.rejects(
    () => executeCoreCommand(dropped, owner, ownerSession, retry),
    /SIMULATED_LOST_RECEIPT/,
  );
  const recovered = await executeCoreCommand(dropped, owner, ownerSession, retry);
  assert.equal(recovered.revision, 9);
  assert.equal((await command(owner, ownerSession, { action: "load" })).revision, 9);
  const disruptionBase = { workspaceId: "c0000001-1111-4111-8111-111111111111", factoryId: fa };
  await executeCoreCommand(store, owner, ownerSession, {
    ...disruptionBase,
    action: "create",
    expectedRevision: 0,
    requestKey: "create-disruption",
    scenario: "C",
  });
  await executeCoreCommand(store, reviewer, reviewSession, {
    ...disruptionBase,
    action: "verify_input",
    expectedRevision: 1,
    requestKey: "verify-disruption",
  });
  const disrupted = await executeCoreCommand(store, owner, ownerSession, {
    ...disruptionBase,
    action: "disruption",
    expectedRevision: 2,
    requestKey: "apply-event",
    eventId: "disruption",
  });
  assert.equal(disrupted.snapshot!.evaluation!.recommendation, null);
  await assert.rejects(
    () =>
      executeCoreCommand(store, owner, ownerSession, {
        ...disruptionBase,
        action: "disruption",
        expectedRevision: 3,
        requestKey: "duplicate-event",
        eventId: "disruption",
      }),
    /CORE_DUPLICATE_EVENT/,
  );
  // Prove digest verification independently of the ordinary immutable-write trigger.
  await db.query("begin");
  await db.query(
    "alter table public.industrial_core_revisions disable trigger industrial_core_immutable",
  );
  await db.query(
    "update public.industrial_core_revisions set event=event||'{\"tampered\":true}'::jsonb where workspace_id=$1 and revision=1",
    [workspace],
  );
  await db.query(
    "alter table public.industrial_core_revisions enable trigger industrial_core_immutable",
  );
  await db.query("savepoint integrity_check;set local role service_role");
  await assert.rejects(
    () =>
      db.query("select public.industrial_core_store('load',$1,$2,$3,$4)", [
        owner,
        ownerSession,
        fa,
        workspace,
      ]),
    /CORE_AUDIT_INTEGRITY_FAILED/,
  );
  await db.query("rollback");
  await db.query("update public.organizations set status='suspended' where id=$1", [a]);
  await assert.rejects(
    () => command(owner, ownerSession, { action: "load" }),
    /CORE_ACCESS_DENIED/,
  );
  await db.query("update public.organizations set status='active' where id=$1", [a]);
  await db.query("delete from auth.sessions where id=$1", [ownerSession]);
  await assert.rejects(
    () => command(owner, ownerSession, { action: "load" }),
    /CORE_SESSION_DENIED/,
  );
  await db.query("delete from private.industrial_core_gate");
  await assert.rejects(() => command(reviewer, reviewSession, { action: "load" }), /CORE_DISABLED/);
  await db.query("insert into private.industrial_core_gate values(true,true)");
  console.log(
    "PASS GM-CORE-003 real PostgreSQL: default-off/missing authority, tenant/plant/session/RLS/direct RPC denial, independent review/approval, revoked authority, idempotency/altered retry, immutable hash-chain history, stale approval and two-connection CAS",
  );
}
