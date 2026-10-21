import EmbeddedPostgres from "embedded-postgres";
import { strict as assert } from "node:assert";
import { readdir, readFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { executeCaseCommand } from "../src/lib/investigation/connected-service";
import { storedCaseSchema, type CaseStore } from "../src/lib/investigation/connected-contract";

// Native PostgreSQL + auth-schema fixtures, NOT Supabase Auth/PostgREST acceptance.
// No remote DB URL is accepted by this runner.
const root = new URL("../", import.meta.url).pathname;
const directory = await mkdtemp(join(tmpdir(), "gridmind-case-pg-"));
const db = new EmbeddedPostgres({
  databaseDir: directory,
  port: 55458,
  user: "postgres",
  password: "synthetic-local-only",
  persistent: false,
  postgresFlags: ["-h", "127.0.0.1"],
  onLog: () => {},
  onError: () => {},
});
let client: ReturnType<EmbeddedPostgres["getPgClient"]> | undefined;
try {
  await db.initialise();
  await db.start();
  client = db.getPgClient();
  await client.connect();
  await client.query(`create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema auth; create schema extensions; grant usage on schema public,auth to anon,authenticated,service_role;
    create table auth.users(id uuid primary key,aud text,role text,email text,created_at timestamptz,updated_at timestamptz,raw_app_meta_data jsonb,raw_user_meta_data jsonb);
    create table auth.sessions(id uuid primary key,user_id uuid not null references auth.users(id),not_after timestamptz);
    create function auth.uid() returns uuid language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid $$;`);
  // Minimal Storage catalog fixture for native SQL policy tests, not Storage HTTP acceptance.
  await client.query(`create schema storage; grant usage on schema storage to authenticated,anon;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid() primary key,bucket_id text references storage.buckets(id),name text,metadata jsonb,unique(bucket_id,name));
    alter table storage.objects enable row level security;
    grant select,insert,update,delete on storage.objects to authenticated;`);
  const migrations = (await readdir(join(root, "supabase/migrations")))
    .filter((n) => n.endsWith(".sql"))
    .sort();
  for (const name of migrations) {
    try {
      await client.query(await readFile(join(root, "supabase/migrations", name), "utf8"));
    } catch (e) {
      throw new Error(`Migration ${name}: ${e instanceof Error ? e.message : e}`);
    }
  }
  console.log(`PASS clean replay: ${migrations.length} migrations`);
  await client.query(
    await readFile(join(root, "supabase/tests/factory-analysis-schema-contract.sql"), "utf8"),
  );
  console.log("PASS canonical and synthetic schema/security catalog contracts");
  const owner = "11111111-1111-4111-8111-111111111111",
    reviewer = "22222222-2222-4222-8222-222222222222",
    outsider = "33333333-3333-4333-8333-333333333333";
  await client.query(
    "insert into auth.users(id,email) values($1,'case-owner@example.test'),($2,'case-reviewer@example.test'),($3,'case-other@example.test')",
    [owner, reviewer, outsider],
  );
  const orgs = await client.query<{ id: number }>(
    "insert into public.organizations(name) values('CASE-SYN-A'),('CASE-SYN-B') returning id",
  );
  const [a, b] = orgs.rows.map((r) => Number(r.id));
  const factories = await client.query<{ id: number }>(
    "insert into public.factories(name,organization_id) values('CASE-SYN-A',$1),('CASE-SYN-B',$2) returning id",
    [a, b],
  );
  const [fa, fb] = factories.rows.map((r) => Number(r.id));
  await client.query(
    "insert into public.organization_members(organization_id,user_id,role,status) values($1,$3,'owner','active'),($1,$4,'viewer','active'),($2,$5,'owner','active')",
    [a, b, owner, reviewer, outsider],
  );
  await client.query(
    "insert into public.factory_members(factory_id,user_id,organization_id,role) values($1,$3,$6,'owner'),($1,$4,$6,'viewer'),($2,$5,$7,'owner')",
    [fa, fb, owner, reviewer, outsider, a, b],
  );
  const database = client;
  const makeStore = (connection: typeof database): CaseStore => ({
    async call(args) {
      await connection.query("begin");
      try {
        await connection.query("set local role service_role");
        const names = [
          "_actor",
          "_op",
          "_case",
          "_factory",
          "_expected",
          "_key",
          "_fingerprint",
          "_snapshot",
          "_event",
        ];
        const values = names.map((key) => args[key] ?? (key === "_event" ? {} : null));
        const result = await connection.query<{ result: unknown }>(
          "select public.investigation_store($1,$2,$3,$4,$5,$6,$7,$8,$9) result",
          values,
        );
        await connection.query("commit");
        return result.rows[0].result;
      } catch (e) {
        await connection.query("rollback");
        throw e;
      }
    },
  });
  const store = makeStore(database);
  const caseId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const create = {
    action: "create",
    caseId,
    factoryId: fa,
    candidate: "C4",
    requestKey: "create-1",
  };
  let current = storedCaseSchema.parse(await executeCaseCommand(store, owner, create));
  assert.equal(current.revision, 1);
  assert(current.snapshot.evidence.every((e) => !e.checked));
  assert.equal(storedCaseSchema.parse(await executeCaseCommand(store, owner, create)).revision, 1);
  console.log("PASS create, unverified intake and idempotent retry");
  const forged = structuredClone(current.snapshot);
  forged.evidence[0].checked = true;
  await assert.rejects(
    () =>
      executeCaseCommand(store, owner, {
        action: "save",
        caseId,
        expectedRevision: 1,
        requestKey: "forge-verification",
        snapshot: forged,
        reason: "Attempt to spoof verification",
      }),
    /SOURCE_VERIFICATION_COMMAND_REQUIRED/,
  );

  await assert.rejects(
    () => executeCaseCommand(store, outsider, { action: "load", caseId }),
    /CASE_ACCESS_DENIED/,
  );
  await assert.rejects(
    () =>
      executeCaseCommand(store, owner, {
        action: "assign",
        caseId,
        expectedRevision: 1,
        requestKey: "wrong-grant",
        userId: outsider,
        role: "reviewer",
        active: true,
        expiresAt: null,
      }),
    /ASSIGNEE_NOT_FACTORY_MEMBER/,
  );
  current = storedCaseSchema.parse(
    await executeCaseCommand(store, owner, {
      action: "assign",
      caseId,
      expectedRevision: 1,
      requestKey: "assign-reviewer",
      userId: reviewer,
      role: "reviewer",
      active: true,
      expiresAt: null,
    }),
  );
  let reviewed = storedCaseSchema.parse(
    await executeCaseCommand(store, reviewer, { action: "load", caseId }),
  );
  assert.equal(reviewed.role, "reviewer");
  await assert.rejects(
    () =>
      executeCaseCommand(store, reviewer, {
        action: "save",
        caseId,
        expectedRevision: 2,
        requestKey: "reviewer-edit",
        snapshot: reviewed.snapshot,
        reason: "attempt edit",
      }),
    /CASE_EDIT_DENIED/,
  );
  for (const e of current.snapshot.evidence)
    current = storedCaseSchema.parse(
      await executeCaseCommand(store, owner, {
        action: "verify",
        caseId,
        expectedRevision: current.revision,
        requestKey: `verify-${e.id}`,
        evidenceId: e.id,
        basis: "Compared invented source bill and output rows against the fixture.",
      }),
    );
  const saved = structuredClone(current.snapshot);
  saved.labor = [
    { id: "L1", role: "founder", hours: 3, shadowRate: 500, task: "synthetic analysis" },
  ];
  saved.expenses = [
    { id: "X1", category: "reviewer", amount: 2000, reference: "private synthetic invoice" },
  ];
  current = storedCaseSchema.parse(
    await executeCaseCommand(store, owner, {
      action: "save",
      caseId,
      expectedRevision: current.revision,
      requestKey: "economics",
      snapshot: saved,
      reason: "Record invented exercise economics",
    }),
  );
  reviewed = storedCaseSchema.parse(
    await executeCaseCommand(store, reviewer, { action: "load", caseId }),
  );
  assert.deepEqual(reviewed.snapshot.expenses, []);
  assert.deepEqual(reviewed.snapshot.labor, []);
  assert(reviewed.history?.every((h) => h.snapshot === undefined));
  await database.query("begin");
  try {
    await database.query("set local role authenticated");
    await database.query("select set_config('request.jwt.claim.sub',$1,true)", [reviewer]);
    assert.equal(
      (
        await database.query("select * from public.investigation_revisions where case_id=$1", [
          caseId,
        ])
      ).rowCount,
      0,
    );
    assert.equal(
      (
        await database.query("select * from public.investigation_assignments where case_id=$1", [
          caseId,
        ])
      ).rowCount,
      0,
    );
  } finally {
    await database.query("rollback");
  }
  console.log("PASS cross-organization denial, reviewer read-only access and economics redaction");
  const review = {
    action: "review",
    caseId,
    expectedRevision: current.revision,
    requestKey: "accept-review",
    reviewer: "Synthetic assigned reviewer",
    competence: "Synthetic electricity method review",
    scope: "E01–E03 arithmetic and hypotheses",
    decision: "accept",
    rationale: "Fixture arithmetic reproduced; no cause or realized savings approved.",
    dissent: "",
  };
  await assert.rejects(
    () => executeCaseCommand(store, owner, review),
    /INDEPENDENT_REVIEWER_REQUIRED/,
  );
  current = storedCaseSchema.parse(await executeCaseCommand(store, reviewer, review));
  assert.equal(current.snapshot.reviews.at(-1)?.actorId, reviewer);
  assert.equal(
    storedCaseSchema.parse(await executeCaseCommand(store, reviewer, review)).revision,
    current.revision,
  );
  await assert.rejects(
    () =>
      executeCaseCommand(store, reviewer, {
        ...review,
        rationale: "Different payload for same key",
      }),
    /IDEMPOTENCY_CONFLICT/,
  );
  const full = storedCaseSchema.parse(
    await executeCaseCommand(store, owner, { action: "load", caseId }),
  );
  assert.equal(full.snapshot.expenses[0].amount, 2000);
  console.log(
    "PASS independent review, private economics preserved and conflicting retries refused",
  );
  const changed = structuredClone(full.snapshot);
  changed.periods[0].kwh += 1;
  const cmd = {
    action: "save",
    caseId,
    expectedRevision: full.revision,
    requestKey: "correction",
    snapshot: changed,
    reason: "Correct invented bill quantity",
  };
  current = storedCaseSchema.parse(await executeCaseCommand(store, owner, cmd));
  assert.equal(current.snapshot.evidence[0].checked, false);
  assert.equal(current.snapshot.evidence[0].verification, undefined);
  await assert.rejects(
    () => executeCaseCommand(store, owner, { ...cmd, requestKey: "stale-write" }),
    /STALE_CASE_REVISION/,
  );
  const historical = storedCaseSchema.parse(
    await executeCaseCommand(store, owner, { action: "load", caseId, revision: full.revision }),
  );
  assert.equal(historical.snapshot.periods[0].kwh, 100000);
  assert.equal(current.snapshot.periods[0].kwh, 100001);
  current = storedCaseSchema.parse(
    await executeCaseCommand(store, owner, {
      action: "assign",
      caseId,
      expectedRevision: current.revision,
      requestKey: "revoke-reviewer",
      userId: reviewer,
      role: "reviewer",
      active: false,
      expiresAt: null,
    }),
  );
  await assert.rejects(
    () => executeCaseCommand(store, reviewer, { action: "load", caseId }),
    /CASE_ACCESS_DENIED/,
  );
  console.log(
    "PASS source re-verification, stale-write refusal, historical reload and reviewer revocation",
  );
  await database.query("begin");
  try {
    await database.query("set local role authenticated");
    await database.query("select set_config('request.jwt.claim.sub',$1,true)", [outsider]);
    assert.equal(
      (await database.query("select id from public.investigation_cases where id=$1", [caseId]))
        .rowCount,
      0,
    );
    await database.query("savepoint denial");
    await assert.rejects(
      () => database.query("select public.investigation_store($1,'read',$2)", [owner, caseId]),
      /permission denied/,
    );
    await database.query("rollback to savepoint denial");
    await assert.rejects(
      () =>
        database.query(
          "insert into public.investigation_cases(id,factory_id,last_editor,created_by) values(gen_random_uuid(),$1,$2,$2)",
          [fa, outsider],
        ),
      /permission denied/,
    );
  } finally {
    await database.query("rollback");
  }
  await assert.rejects(
    () =>
      database.query("update public.investigation_revisions set event='{}' where case_id=$1", [
        caseId,
      ]),
    /IMMUTABLE/,
  );
  await database.query(
    "update public.organization_members set status='suspended' where user_id=$1",
    [owner],
  );
  await assert.rejects(
    () => executeCaseCommand(store, owner, { action: "load", caseId }),
    /CASE_ACCESS_DENIED/,
  );
  console.log(
    "PASS PostgreSQL RLS, forged actor/direct write refusal, immutable revision trigger and membership revocation",
  );
  await database.query("update public.organization_members set status='active' where user_id=$1", [
    owner,
  ]);
  current = storedCaseSchema.parse(
    await executeCaseCommand(store, owner, { action: "load", caseId }),
  );
  current = storedCaseSchema.parse(
    await executeCaseCommand(store, owner, {
      action: "assign",
      caseId,
      expectedRevision: current.revision,
      requestKey: "expired-reviewer",
      userId: reviewer,
      role: "reviewer",
      active: true,
      expiresAt: "2020-01-01T00:00:00Z",
    }),
  );
  await assert.rejects(
    () => executeCaseCommand(store, reviewer, { action: "load", caseId }),
    /CASE_ACCESS_DENIED/,
  );
  const concurrentClient = db.getPgClient();
  await concurrentClient.connect();
  try {
    const changes = ["Concurrent invented question A", "Concurrent invented question B"].map(
      (question, i) => ({
        action: "save",
        caseId,
        expectedRevision: current.revision,
        requestKey: `concurrent-${i}`,
        snapshot: { ...current.snapshot, scope: { ...current.snapshot.scope, question } },
        reason: "Concurrent synthetic correction",
      }),
    );
    const raced = await Promise.allSettled([
      executeCaseCommand(store, owner, changes[0]),
      executeCaseCommand(makeStore(concurrentClient), owner, changes[1]),
    ]);
    assert.equal(raced.filter((r) => r.status === "fulfilled").length, 1);
    const refused = raced.find((r) => r.status === "rejected");
    assert(refused?.status === "rejected" && /STALE_CASE_REVISION/.test(String(refused.reason)));
    const head = storedCaseSchema.parse(
      await executeCaseCommand(store, owner, { action: "load", caseId }),
    );
    assert.equal(head.revision, current.revision + 1);
  } finally {
    await concurrentClient.end();
  }
  console.log(
    "PASS expired assignment denial and concurrent-writer CAS with two PostgreSQL connections",
  );
  const { verifyPortal } = await import("./portal-acceptance");
  await verifyPortal(database, store, owner, reviewer, outsider, fa, a);
  const coreConnection = db.getPgClient();
  await coreConnection.connect();
  try {
    const { verifyIndustrialCore } = await import("./industrial-core-acceptance");
    await verifyIndustrialCore(database, coreConnection);
  } finally {
    await coreConnection.end();
  }
  const { verifyCompressedAir } = await import("./compressed-air-acceptance");
  await verifyCompressedAir(database, store, owner, reviewer, outsider, fa, () => db.getPgClient());
  if (process.env.GRIDMIND_CASE_BROWSER === "1") {
    // Restore ONLY this disposable fixture actor for the browser scenario.
    await database.query(
      "update public.organization_members set status='active' where user_id=$1",
      [owner],
    );
    const { verifyConnectedBrowser } = await import("../e2e/connected-browser-acceptance");
    await verifyConnectedBrowser((command) => executeCaseCommand(store, owner, command), fa);
  }
} finally {
  if (client) await client.end();
  await db.stop();
}
