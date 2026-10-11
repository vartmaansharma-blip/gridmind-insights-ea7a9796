# GridMind Milestone: Prove Secure Operation and Measurable Factory Value

**Date:** 2026-10-11  
**Milestone:** Replace feature accumulation with evidence that GridMind protects factory data, completes its core workflow, and helps improve a measured operational outcome.  
**Status:** In progress. Database-level checks provide partial evidence; authenticated production workflow and commercial value remain unproven.  
**Rule:** Record verified results separately from hypotheses. Never create synthetic business records in production or describe a proposed target as a result.

## Executive decision

The next milestone has two independent gates:

1. **Trust gate:** prove the authenticated user journey and tenant boundaries work end to end on the exact release candidate.
2. **Value gate:** run one controlled, buyer-approved factory pilot with a pre-agreed baseline, intervention, and independently reviewable outcome.

A successful build, a healthy database, RLS enabled, or a polished dashboard is not enough to pass either gate.

## 1. Current evidence snapshot

### Database and access checks

Read-only checks against Supabase project `bvqmvgbfqhgczwbvlqkk` on 2026-10-11 found:

- PostgreSQL version: **17.11**.
- **42/42** public base tables have row-level security enabled; the catalog query found **0** public base tables without RLS.
- Administrative counts: **1** Auth user, **4** factories, **8** factory assets, **0** observations, and **0** factory analysis runs.
- Under the `authenticated` database role, the existing user identity saw **3** factories, **0** assets, and **0** observations.
- Under the same role, a non-member test UUID saw **0** factories, **0** assets, and **0** observations.

These are useful smoke-test results, but they are **not** proof of two real users being isolated through the deployed application. The eight existing assets are not visible to the one existing user's membership, so the live check did not test cross-tenant isolation against populated assets. The observations and analysis-run tables have no live rows.

### Important access boundary discovered

A direct authenticated `SELECT` against `public.factory_analysis_runs` is denied by table privileges. Do **not** grant direct access merely to make a diagnostic query pass. The application uses the `persist-factory-analysis` Edge Function with JWT verification enabled; the intended authorized read/persistence path must be confirmed in the client and acceptance tests before changing grants.

### Outstanding security and release signals

Supabase Security Advisor currently reports:

1. **Warning:** authenticated users can execute `public.create_factory_workspace(...)`, a `SECURITY DEFINER` onboarding RPC. Static review previously found an empty search path and an `auth.uid()` check, but the warning remains until the authorization contract is tested with separate real identities, including organization-selection edge cases.
2. **Warning:** leaked-password protection is disabled. Enable it in Supabase Auth settings after checking the current login and recovery flows.
3. **Performance advisory:** many indexes are unused in the current low-traffic snapshot. Do not drop them without workload evidence and query-plan review.

The latest successful Vercel production deployment observed is [deployment `dpl_72GwVVgx9JvDYHhYS5XTbFVeE9LP`](https://vercel.com/vartmaansharma-blips-projects/gridmind/72GwVVgx9JvDYHhYS5XTbFVeE9LP), marked READY on commit `50c57c89e48b80162ddb33599467ab61a973aeab`. The current repository commit `da16717861b2c5baf6beca17acc02b6cd7354088` has a Vercel failure status whose target identifies a build-rate-limit/plan restriction. GitHub comparison confirms the commits after `50c57c89` change documentation only, not application source. Thus a successful deployment exists for the unchanged application source, but the exact-current-commit release check remains red; do not describe the latest commit as fully green.

Prior CI, Quality Gate, and migration-replay successes documented in the security audit were on earlier commits. Do not silently treat those results as proof that the latest commit is green.

## 2. Trust gate — acceptance tests required

Run these in an isolated test environment with two distinct authenticated test users and factory fixtures. Do not seed test records into production.

### A. Authentication and workspace

- User A signs in through the deployed candidate's normal login flow.
- User A creates or selects a workspace using the supported UI/RPC path.
- User B belongs to a different factory/workspace.
- An unauthenticated caller cannot create a workspace; a caller without an authenticated identity is rejected.
- Neither user can attach themselves to an organization they do not control.
- Multi-organization behavior is explicit and deterministic rather than silently choosing an unintended organization.

### B. Tenant isolation

For both read and write operations, assert that User A cannot read, insert into, update, or delete User B's factory-scoped records, and vice versa. Cover factories, assets, observations, opportunities, analysis runs, evidence, decisions, intervention records, and verification records that the application actually exposes. Include RPCs and Edge Functions, not just direct table queries. Confirm any views preserve the intended RLS boundary.

A zero-row result is acceptable for a denied row-level operation only when the test also proves that the fixture exists and is visible to its legitimate owner. A test that runs against empty tables is not an isolation proof.

### C. Analysis persistence and reload

Using the actual authenticated application flow:

1. Submit one valid analysis against an authorized test asset.
2. Confirm the Edge Function authenticates the request and validates factory/asset membership.
3. Confirm exactly one durable analysis record is created through the intended path.
4. Reload the page or start a fresh session and retrieve the same analysis through an authorized read path.
5. Retry the same idempotency key and prove no duplicate record is created.
6. Reuse the key with conflicting inputs and prove the conflict is rejected.
7. Attempt cross-factory asset IDs and caller-injected economic/measurement assumptions; prove they are rejected or clearly handled according to the contract.
8. Confirm an unauthorized user cannot retrieve the record, including through direct REST/RPC calls.

Capture the commit SHA, environment, test identities (non-secret labels only), fixture IDs, expected result, actual result, and logs. Do not log passwords, bearer tokens, service-role keys, or customer data.

### D. Release reproducibility

The exact candidate commit passes:
- CI: typecheck, lint, unit tests, link checks, and production build;
- Quality Gate, including Edge Function checks;
- clean migration replay from an empty database;
- two-user HTTP/SQL acceptance tests;
- a successful Vercel deployment and a live authenticated workflow smoke test.

A Vercel build-rate-limit failure must be resolved or explicitly documented as a release blocker. A green status on an earlier SHA does not satisfy this gate.

## 3. Value gate — first-factory pilot protocol

**Do not select the first use case because it is easy to build or makes the best demo.** Select it after a real factory owner identifies a costly, recurring problem and agrees to share the minimum necessary data. Candidate categories may include recurring unplanned downtime, yield/scrap loss, energy/material waste, or a bounded procurement/quality workflow; none is validated by this document.

### Pilot scope

- **One factory, one production line or bounded asset group, one loss/problem category.**
- One named operational owner and one person authorized to approve the intervention.
- One agreed data source and one documented manual fallback if the source is incomplete.
- One analysis question, one proposed intervention, and one outcome-verification method.
- Human approval for operational changes; GridMind does not autonomously control equipment.
- Written permission for the data used, retention period, access roles, and how results may be reported.

### Timeline

| Stage | Duration | Required evidence |
|---|---:|---|
| Scope and preregistration | 2–3 working days | Named owner, chosen problem, metric definition, data permission, exclusions, and success/stop rules signed off |
| Baseline | 10 working days, or longer if event volume is low | Raw source records, operating context, missing-data log, and baseline calculation |
| Investigate and approve | 2–5 working days | Evidence-linked hypothesis, uncertainty, alternatives, and human-approved action |
| Intervention observation | 10 working days minimum | Action log, comparable operating conditions, outcome records, and adverse-effect checks |
| Verification and decision | 2–3 working days | Reproducible before/after calculation reviewed by the factory owner; finance review if monetary value is claimed |

Extend the observation window if there are fewer than **five comparable events in either period**. If comparable events remain too sparse or conditions differ materially, report the result as **inconclusive**, not successful.

### Metric contract

Choose and sign one primary metric before looking at post-intervention results. For an unplanned-downtime pilot, a candidate is:

`Normalized downtime = unplanned downtime minutes / scheduled operating hours`

Report the numerator and denominator, not only a percentage. Stratify or qualify comparisons for product mix, shift, planned maintenance, operating hours, and throughput. For scrap, energy, procurement, or quality use cases, choose a domain-appropriate normalized measure with the factory owner instead; do not force the downtime metric onto another problem.

Track secondary measures only when the data is available and meaningful:
- time from issue detection to evidence-backed decision;
- recurrence frequency and severity;
- percentage of required records present and usable;
- intervention adoption/completion;
- throughput, quality, safety, and other agreed guardrails.

### Proposed pilot hurdle — a hypothesis, not a forecast

For a selected loss metric, set a provisional target of **at least 15% improvement against the preregistered, normalized baseline**, sustained for two consecutive observation weeks, with no material deterioration in agreed safety, quality, or throughput guardrails. The factory owner may choose a different threshold before the pilot if the economics or natural variability justify it.

The pilot does **not** pass on percentage movement alone. It also requires:
- at least 90% completeness for the agreed critical data fields, or an explicit signed-off alternative;
- sufficient comparable events and documented operating-context differences;
- a traceable link between the recommendation, approved action, and observed result;
- factory-owner review of the calculation;
- no unsupported causal claim when other changes could explain the outcome.

If the target is missed, record whether the failure was due to the hypothesis, data, execution, confounding conditions, or insufficient sample size. A well-run negative result is useful evidence.

### Financial value verification

Do not present estimated opportunity value as realized savings. When a monetary claim is justified, calculate it from the agreed physical outcome and factory-approved unit economics, then subtract implementation/intervention costs. Have the appropriate factory owner or finance representative confirm the assumptions and result in writing. Separate:
- **estimated opportunity** (modelled, not realized);
- **observed operational change** (measured, not automatically causal);
- **verified financial outcome** (calculated from agreed records and reviewed by the responsible owner).

No public customer claim or case study without explicit permission and evidence review.

## 4. Decision gates

### Proceed to a limited pilot only when

- a real buyer/owner confirms the problem is important and recurring;
- data access and the baseline can be agreed;
- one operational intervention can be approved safely;
- the measurement contract and success/stop rules are preregistered.

### Call the pilot successful only when

- the trust gate has passed for the relevant workflow;
- the primary metric meets its pre-agreed threshold with enough comparable evidence;
- guardrails hold;
- the factory owner accepts the result;
- the financial claim, if any, is independently reviewable.

### Narrow, pivot, or stop when

- data access is unavailable or unreliable;
- the workflow adds more work than it removes;
- an existing alternative solves the problem better or more cheaply;
- the measured change is too small, too costly, or not reproducible;
- users will not trust or act on the evidence;
- the required privacy, safety, or authorization boundary cannot be maintained.

## 5. Immediate execution order

1. Keep the current no-direct-grant boundary on `factory_analysis_runs` until the intended client/Edge Function contract is verified.
2. Inspect the latest GitHub Actions run results and rerun/repair the release pipeline as appropriate; resolve the Vercel build-rate-limit blocker.
3. Add/confirm isolated two-user fixtures for populated asset and analysis persistence tests; run the HTTP acceptance suite.
4. Complete a real sign-in → workspace → analysis → reload test against the release candidate.
5. Enable leaked-password protection after verifying sign-in/recovery behavior.
6. Complete buyer discovery and choose one factory problem with an owner and data permission.
7. Preregister the pilot metric and baseline before recommending any intervention.
8. Update this record with exact evidence, test SHA, links, and pass/fail/inconclusive outcomes.

**Current conclusion:** GridMind has a meaningful security foundation, but the full user journey is not yet proven and no measurable factory value has been demonstrated. The next proof is not another feature: it is one secure, reproducible workflow followed by one honest, measured pilot.


## Execution update — 2026-10-11

### Trust gate: isolated two-user persistence/isolation suite passed

The GitHub Actions run [38118481616 — Clean local database migration replay](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/38118481616) has now completed successfully. Its completed steps include:

- Starting an isolated local Supabase stack and replaying all migrations from an empty database.
- Verifying the canonical analysis persistence schema contract.
- Testing tenant isolation, direct-table denial, and append-only persistence.
- Creating two confirmed test users through the local Auth Admin API and seeding isolated tenant fixtures.
- Exercising the authenticated Edge Function end to end.
- Verifying there are no pending local migrations.

The HTTP integration suite in `supabase/tests/factory-analysis-integration.deno.ts` specifically tests cross-tenant denial, unauthenticated rejection, rejection of client-supplied measurement/economic inputs, durable analysis persistence, same-key idempotent retry, conflicting-key rejection, concurrent retries, reproducibility/input-digest verification, direct-table read/write denial, and oversized-request rejection. The workflow's successful conclusion is evidence these configured checks passed in the isolated test environment.

The CI and Quality Gate runs previously recorded as passing are [CI 38118481636](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/38118481636) and [Quality Gate 38118481623](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/38118481623) on commit `bb0b4386c553dea5f7a908b5ee63295da4e8f8a6`. The migration replay has now also completed successfully on its tracked run. Later changes through the current documentation commit are documentation-only, but do not relabel the Vercel check as green.

### Release check: still blocked by Vercel build-rate limit

- The latest successful production deployment observed is [READY deployment `dpl_72GwVVgx9JvDYHhYS5XTbFVeE9LP`](https://vercel.com/vartmaansharma-blips-projects/gridmind/72GwVVgx9JvDYHhYS5XTbFVeE9LP), on application-source commit `50c57c89e48b80162ddb33599467ab61a973aeab`.
- The current documentation commit `ee0bdf7878629f434bef1d6c055f81bb20db8f07` reports Vercel status failure with a target indicating a build-rate-limit/plan restriction.
- This is a platform/quota blocker, not evidence that the application build itself failed. No plan upgrade, billing change, or weakening of deployment checks has been made.
- The deployed application source has not changed in the documentation-only commits after the last READY deployment. Nevertheless, a live authenticated production sign-in → workspace → analysis → reload test remains unverified. Do not call the production trust gate passed until that workflow is tested on an authorized account and the release signal is resolved or explicitly accepted by the responsible owner.

### Value gate: pilot preparation is ready; real-factory execution has not started

The buyer-discovery protocol and real-factory data request already exist in this repository. No real buyer interview, factory permission, data transfer, intervention, savings, or paid pilot is claimed. The next fieldwork target is three short discovery interviews with reachable plant/operations, maintenance/continuous-improvement, or energy/utility owners. Use their actual recent incidents and records to choose the wedge; do not assume energy loss is the right wedge simply because the data-request template supports it.

**Pilot activation sequence**
1. Obtain a real factory owner's agreement to a discovery conversation; do not invent a prospect or imply a relationship.
2. Establish one recent, recurring problem and ask what source records can verify its frequency and consequence.
3. Confirm who owns the problem, who can authorize data use, who can approve any operational change, and what confidentiality/retention rules apply.
4. Choose one problem only if a minimum viable baseline and a safe, human-approved intervention are feasible.
5. Preregister the primary normalized metric, guardrails, exclusions, observation windows, and stop criteria before examining post-intervention results.
6. Do not ingest real factory data or recommend operational action until production access control and data-handling arrangements have been verified. Any pilot data must use the factory's approved controlled storage/transfer route, not public GitHub.

**Current decision:** isolated technical acceptance is now demonstrated. Production authenticated workflow, Vercel release status, and buyer/pilot validation remain open. No database permission was broadened and no production business data was fabricated.


### Release-quota mitigation applied — 2026-10-11

The Vercel project now has an Ignored Build Step command:

`git diff --quiet HEAD^ HEAD -- . ':(exclude)docs/**' ':(exclude)README.md'`

Intent: skip a deployment build only when the commit changes files exclusively under `docs/` and/or the repository-root `README.md`; any change outside those paths should continue to the normal build. If Git cannot compare the commit with its parent, the command should fail non-zero and allow the build rather than silently skipping it.

This is a preventive quota-control measure, not a claim that the pre-existing failed Vercel check has turned green. The project domains and last READY deployment were re-read after the setting update and remained present. Verify the next code-changing commit receives a normal successful deployment; if the current Vercel plan limit still blocks builds, the remaining options are to wait for the quota window to reset or have the project owner approve a plan change. No billing change was made.
