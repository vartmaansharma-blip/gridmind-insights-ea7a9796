# GridMind internal MVP — implementation and Lovable handoff

**Status:** Supporting implementation contract for [issue #105](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/105), 16 October 2026. The [Master Plan](gridmind-master-plan-2026-10-11.md) dated build exception is authoritative. This is not a second roadmap or a pilot-readiness claim.

The [supplied blueprint](gridmind-mvp-build-blueprint.md) is preserved as supporting requirements. Offline generated examples are in [`data/synthetic-investigation`](../data/synthetic-investigation/README.md); reproduce them with `bun run demo:brief`.

## What is implemented

Open `/investigations` for the offline exercise, or `/investigations-connected` for the server-backed synthetic workflow. Both reuse the same domain contracts and method engine:

| Step | Implemented behavior |
|---|---|
| Scope / SOW | Decision question, owner, site/asset/period boundary, alternative, residual gap, exclusions, acceptance and stop rules; draft SOW export |
| Evidence | Source register, owner, permitted use, source verification, conflicts, received time, retention and limitations; source corrections/removals retain previous values |
| Analysis | C4 verified consecutive-period comparison, explicit production basis, arithmetic and source IDs; C1 raw/reconciled timeline and bounded stop duration; no causal diagnosis |
| Findings | Observation/hypothesis/next-check classes, supporting sources, counter-evidence, limitations, discriminating checks and challenge/rejection state |
| Review | Simulated named reviewer, competence, scope, accept/revise/reject, rationale and dissent; exact-content binding and stale-review detection |
| Brief | Versioned Markdown executive brief, unknowns, source/calculation/timeline appendix and review history; export current or retained historical version |
| Decision/outcome | Separate pending/accepted/declined/deferred decision, metric, baseline, window, source-linked observation and confounders; no automatic implementation/savings verification |
| Economics | Effort by role, direct cash expenses, founder/analyst shadow labor, distinct quote/agreement/invoice/collection events, cash and adjusted contributions; separate INTERNAL export |
| Recovery | Versioned local synthetic storage, explicit change reasons, bounded retained revisions, backup/restore validation, raw backup, corruption/quota/conflicting-tab protection and confirmed reset |

C4 reuses draft PR #103 with an additional finite-arithmetic guard. Known answers: 33.33% intensity change, 20% consumption change, −10% recorded output. C1 starts with unreconciled clocks and withholds duration until reconciled; fixture duration is 62 minutes. Neither is a cause or money-recovery claim.

All review actions and source records are synthetic. `approvedForCustomerDelivery` is always `false`. A synthetic accept demonstrates the state machine only. Review binding includes `METHOD_VERSION`; bump it when analysis/review semantics change so prior reviews become stale. Browser tab checks are optimistic conflict detection, not multi-user atomic locking.

Local storage is confined to the offline exercise. Connected cases use `/api/investigations` and versioned PostgreSQL snapshots; case contents are not cached in browser local storage. The existing Supabase client still manages authentication sessions. The connected API is **disabled by default**, accepts only synthetic cases and requires a verified non-anonymous Supabase identity.

### Connected backend delivered in the follow-up

- Reuse existing organization/factory membership. Three source-only lifecycle tables hold cases, immutable revisions and scoped investigator/reviewer assignments; the eight domain objects live in the versioned case snapshot.
- Server-controlled create/save/verify/review/assign/load commands. Source verification records the authenticated actor, time and basis; changing linked measurements or source metadata clears that verification. Clients cannot forge verification or review history through ordinary saves.
- Database row locks and expected revisions prevent lost updates. Actor-bound request fingerprints make retrying a committed request safe and reject reused keys with different commands. SHA-256 checks detect stored snapshot corruption; historical reload/export uses the selected revision.
- Owner/admin members manage scoped assignments. Investigator/reviewer access requires active organization and factory membership plus active, unexpired assignment. Review additionally requires an explicit reviewer assignment and an actor different from the last editor. This is simulated review; professional competence is declared, not certified.
- Reviewer responses omit labor, expenses and payments, including historical snapshots. Raw revision-table reads are denied to reviewers. Membership suspension and assignment revocation take effect on subsequent requests. Root factory owner/admin authority is inherited; revoking a case assignment does not revoke that authority.
- The public actor-bearing RPC is executable only by the server role. Browser roles have no direct mutation grants. The server-only secret never uses a `VITE_` variable. Responses disable caching and hide internal storage errors.

The new migration is committed **source**, replayed only in disposable local PostgreSQL. No production migration or production deployment, real-file upload or real-data intake was performed. The existing Git integration created a Vercel READY preview on `7bb9b6092248acabc302cc8ac5c8342455906082`; its offline investigation route returned HTTP 200 with the expected synthetic labels. That preview is separate from the isolated connected-backend acceptance and customer release gates. The old factory-monthly-input → asset-only Edge contract is a separate unresolved ledger item.

## Ownership and editable boundaries

**Codex:** domain contracts, deterministic calculations, validation, review binding, persistence/recovery logic, exports, tests and repository integration. Connected synthetic persistence, authenticated actor handling and scoped permissions are implemented in source. Isolated full-stack acceptance, real-file custody, qualified review and production release remain Codex/backend work under the existing gates.

**Lovable:** layout, spacing, typography, navigation treatment, responsive interaction design, progressive disclosure and visual presentation of the functional controls. The existing controls are deliberately a scaffold. Preserve TanStack Start + React + Vite + Bun and the Lovable configuration wrapper; use the existing component library and tokens.

Key source files:

- [`schema.ts`](../src/lib/investigation/schema.ts): strict runtime data contracts and bounded storage envelope.
- [`engine.ts`](../src/lib/investigation/engine.ts): analysis blockers, source-linked arithmetic, review state, outcome validation and economics.
- [`workspace.ts`](../src/lib/investigation/workspace.ts): revisions, history, serialization and storage boundary.
- [`brief.ts`](../src/lib/investigation/brief.ts): decision brief, draft SOW and internal cost exports.
- [`fixtures.ts`](../src/lib/investigation/fixtures.ts): invented neutral C1/C4 fixtures.
- [`workbench.tsx`](../src/components/investigation/workbench.tsx) and [`record-form.tsx`](../src/components/investigation/record-form.tsx): functional UI adapters; restyle without duplicating domain rules.
- [`investigations.tsx`](../src/routes/investigations.tsx) and [`investigations-connected.tsx`](../src/routes/investigations-connected.tsx): route sources. Vite generates the route tree; do not hand-edit it.
- [`connected-contract.ts`](../src/lib/investigation/connected-contract.ts), [`connected-service.ts`](../src/lib/investigation/connected-service.ts), [`connected.server.ts`](../src/lib/investigation/connected.server.ts): typed commands, server transitions and verified-token API adapter.
- [`connected-workbench.tsx`](../src/components/investigation/connected-workbench.tsx): minimal connected controls for Lovable to refine.
- [`case migration`](../supabase/migrations/20261016075004_investigation_case_persistence.sql): source-only RLS, revisions, assignment and atomic RPC contract.
- [`PostgreSQL acceptance`](../verification/postgres-acceptance.ts) and [`browser driver`](../e2e/connected-browser-acceptance.ts): disposable synthetic verification, with clearly identified fixture transports.

## Paste into Lovable

> Continue the GridMind internal investigation workspaces at `/investigations` and `/investigations-connected` from the `codex/investigation-mvp` branch/associated PR. Refine the product design using existing React/TanStack Start/Vite/Bun and shadcn/Tailwind components. Keep one integrated scope → evidence → analysis → findings → review → Decision Brief flow, with outcome, economics and retained history. Improve readability, mobile navigation, source-reference visibility, blocker explanations, form ergonomics and the executive brief preview. Reuse `src/lib/investigation` as the sole source of validation and calculations. Preserve explicit SYNTHETIC labeling, customer-release BLOCKED state, clock/conflict gates, stale-review protection, separate payment stages and cash/shadow economics. Do not fabricate real approval, customers, savings or revenue. Do not add real-data uploads, production database changes, a new dashboard, tariff diagnosis, machine instructions, AI-generated findings or deployments. Use the sourced cross-category reference table in this handoff: Linear for case focus, Carbon for evidence density, Power BI for source inspection, GitHub for review validity, Stripe for financial states, GOV.UK/W3C for recovery/accessibility and NN/G for progressive disclosure. Adapt principles rather than copying entire products. Preserve connected source-verification commands, scoped reviewer permissions, redaction, expected-revision conflicts and safe retries. Backend changes and release gates remain with Codex; do not enable the feature or apply migrations to production. Keep published Git history intact and coordinate through the PR.

## Reference patterns across categories — researched 16 October 2026

These are selected primary-source references with strong relevance to this workflow, not an objective ranking of the world's “best” products. The source column describes documented behavior; the GridMind adaptation is our design/engineering judgment. No integration, endorsement, copied interface, market superiority or compliance certification is implied. This is a reference pack for the current implementation, not a new feature backlog. Pages were read; no signed-in competitor UI or visual audit was performed.

| Category / reference | Documented pattern and why it matters | GridMind adaptation / owner |
|---|---|---|
| Focused operational workspace — [Linear display options](https://linear.app/docs/display-options) | Configurable issue properties and grouping help keep the relevant state visible. | **Lovable:** a compact case header with question, owner, status and next blocker. Keep secondary metadata out of the primary decision view. |
| Bounded work decomposition — [Linear parent/sub-issues](https://linear.app/docs/parent-and-sub-issues) | Related work can remain attached to its parent with selectable property visibility. | **Lovable:** evidence checks and review challenges stay inside their investigation, rather than becoming unrelated dashboard modules. No new task-management system is requested. |
| Decision/action traceability — [Palantir action log](https://www.palantir.com/docs/foundry/action-types/action-log) | Decision-driven object changes can be represented as inspectable action records. | **Codex implemented:** explicit revision reason and retained case snapshot. **Lovable:** expose that history clearly. A local exercise log is not Foundry-scale audit infrastructure. |
| Audit accountability — [Palantir audit logs](https://www.palantir.com/docs/foundry/security/audit-logs-overview) | Audit records identify actor, action, time and affected resource. | **Codex future backend gate:** authenticated actor attribution and authorized server-side audit. **Current UI:** simulated actor and timestamp must remain visibly simulated. |
| Evidence lineage — [Microsoft Power BI lineage](https://learn.microsoft.com/en-us/power-bi/collaborate-share/service-data-lineage) | Users can inspect dependencies and related artifacts, then inspect associated metadata. | **Codex implemented:** source IDs on calculations/findings. **Lovable:** source chips opening the relevant register/appendix and visible impact of a changed source. Avoid a large generic graph. |
| Review validity — [GitHub protected-branch review rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches) | Approval can become stale when reviewable content changes. | **Codex implemented:** review binds to technical content and method version; changes require re-review. **Lovable:** show pending, rejected and stale states explicitly; keep customer release separate. |
| Financial truth — [Stripe invoice lifecycle](https://docs.stripe.com/invoicing/overview) | Draft/open/paid/void/uncollectible invoice states are distinct; finalization is not equivalent to collection. | **Codex implemented:** quote, contract, invoice and receipt records stay distinct; no collection inferred from intent. **Lovable:** readable stage/date/amount/reference presentation. No payment integration is requested. |
| Dense evidence presentation — [IBM Carbon data tables](https://www.carbondesignsystem.com/building-blocks/core/components/data-table/guidelines) | Consistent table density, clear headers and expandable supplementary detail support evidence inspection. | **Lovable:** readable source/period registers with inline detail and responsive alternatives; preserve original values, units, verification and conflicts. Adopt interaction principles using existing shadcn components, not another component framework. |
| Error recovery — [GOV.UK error summary](https://design-system.service.gov.uk/components/error-summary/) | A summary and matching field errors help users locate and correct invalid answers; keyboard focus belongs on the summary. | **Lovable:** actionable blocker summaries linked to their fields, matching inline wording and focus behavior. **Codex:** retain the domain blockers; styling cannot bypass them. Full GOV.UK conformance is not claimed. |
| Information hierarchy — [Nielsen Norman Group progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/) | Secondary options can be deferred so primary tasks remain easier to understand. | **Lovable:** decision, verified observations, unknowns and next checks first; arithmetic, sources, review history and internal economics in secondary views. Never hide a material limitation. |
| Accessible responsive behavior — [W3C WCAG reflow guidance](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) | Content should remain usable when the available viewport narrows, subject to specified exceptions. | **Codex verified:** the synthetic scaffold works at 390px without page-wide overflow. **Lovable:** retain keyboard labels/focus and test zoom/narrow layouts. This one test is not a full WCAG audit. |
| Structured investigation method — [UK HSE HSG245](https://www.hse.gov.uk/pubns/books/hsg245.htm) | Investigation distinguishes gathering/analyzing information, controls and implementation planning. | **Codex method boundary:** records → analysis → qualified decision → follow-up; preserve missing evidence and competing hypotheses. This reference does not authorize accident investigation, site work or technical interventions by GridMind. |
| Security acceptance — [OWASP ASVS](https://owasp.org/projects/asvs) | A requirement-based framework supports testing application security controls. | **Codex future backend gate:** map actual auth, authorization, storage and validation controls to testable requirements. Synthetic browser tests do not establish ASVS compliance or tenant security. |

**Recommended visual synthesis for Lovable:** Linear's focus on the current work item; Carbon's readable evidence density; Power BI's inspectable source relationships; GitHub's explicit review validity; Stripe's distinct commercial states; GOV.UK/W3C's recoverable, accessible forms. Use these patterns to improve the existing integrated workflow. The executive brief remains the primary deliverable; no reference licenses broader product scope.

## Run and verify

```sh
bun install --frozen-lockfile
bun run check
bun run test:intake
cd e2e
bun install --frozen-lockfile
bun x playwright install chromium
bun run test:synthetic
```

`bun run check` includes production-preview smoke checks. The synthetic browser suite runs the production build on port 4185 without customer/auth credentials and blocks external network requests. The existing authenticated suite stays separate and requires the isolated local stack; synthetic results never stand in for tenant/file security acceptance.

## Connection Ledger reconciliation

The supplied file advanced to **Version 3.4** during this work. Its §4A/4B and [existing Connection Ledger #104](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/104) remain the record for authoritative UI/API/database integration. This implementation delivers an explicitly isolated synthetic method path; it does **not** close that ledger or route factory bills into an asset engine.

The known legacy blocker is still **factory-scoped monthly entry → asset-scoped Edge method**. Do not rename factory billing metrics or promote manual inputs to bypass it. The new C4 comparison is arithmetic-only and synthetic, with no tariff/order validation; C1 is a bounded synthetic chronology, with no root-cause or production-loss inference. The shared `fixtures.ts` feeds the UI, domain tests, backup and generated brief, connecting the synthetic artifacts while leaving the distinct asset SQL method intact.

The connected synthetic path now implements factory/case identity, source verification actor/time/basis, correction invalidation, persisted snapshots/findings/reviews, reproducible briefs and scoped assignments. Real-case contract work still needs an authorized facility-meter/process/asset boundary, validated method dispatch, secure file custody and the ledger's full authenticated two-organization acceptance paths. These are Codex/backend responsibilities after applicable gates, not tasks silently passed to Lovable. No `AT01`–`AT12` from #104 is claimed passed merely because a similarly named local synthetic check succeeds.

## Remaining live-operation dependencies

Real-data intake/customer release stays blocked until buyer scope, Tier 1/Tier 2, professional review terms, permissions, secure custody/retention, authoritative authenticated persistence and exact-candidate tenant/file/reload/security acceptance pass. The synthetic schema reuses existing tenant/membership tables and stores the eight case objects in immutable revisions; review that mapping and migration drift before any shared database application. This change deliberately does not claim those dependencies are satisfied, and they are not assigned to Lovable.

Reviewer engagements, actual buyer interviews, pricing acceptance, delivery effort and payment must be obtained and recorded by the responsible humans in the existing discovery/commercial records. Exports provide templates; they do not invent agreements.

## Verification record

Results and exact candidate commit are recorded in the PR. The existing CI workflow is preserved: GitHub rejected a workflow edit because the connected OAuth app lacks `workflow` scope. The synthetic browser suite remains committed and runnable with `cd e2e && bun run test:synthetic`; adding it to CI requires a repository owner/credential with workflow permission. This document describes the implementation, not evidence that all checks have passed. No deployed state is implied.

## Repeatable verification and remaining gates

Local checks cover 127 Vitest tests, 21 Python intake tests, TypeScript, ESLint (zero errors; eight existing Fast Refresh warnings), Markdown links, production build and nine-route preview smoke plus redirect. Six offline Chromium scenarios protect recovery and the original method flow. The native PostgreSQL runner replays all 34 source migrations, checks catalog permissions and exercises cross-organization denial, reviewer redaction, protected verification, independent review, retry conflicts, corrections, history, direct-write denial, expired/revoked access and concurrent-writer conflicts using two database connections.

The connected production-browser scenario reaches the real command processor and disposable PostgreSQL through a **fixture** API transport. It verifies create → correction → save/reload → source verification → historical reload/export, responsive width, default-disabled API and absence of case local storage. Auth and PostgREST are fixtures in that local scenario; API unit tests also mock Supabase. They do not substitute for full Supabase acceptance.

The existing Migration Replay CI entry points now include synthetic schema/grant checks and an Auth/PostgREST wire-contract test. That test signs in two local users, verifies identity, exercises service-only case RPC create/retry/reload, and denies forged actors, conflicting fingerprints and cross-tenant reads. That wire test covers the storage boundary. The committed [connected authenticated browser test](../e2e/connected-authenticated.pw.ts) also runs through the real application API, Supabase Auth, PostgREST and database: lost-response retry, re-login/reload, authenticated source verification, independently assigned reviewer acceptance, historical brief and foreign-tenant denial. Its setup provisions only disposable fixture users/membership and obtains server-only credentials from the loopback CLI stack; no admin credential is passed in a `VITE_` variable or to browser code. This suite runs in the existing Migration Replay job. Consult PR #106 for the exact committed SHA and actual remote result; test source alone is not passing evidence.

Reproduce the local connected scenario without Docker on macOS ARM64 (the native binary's symlink setup is explicitly trusted only for this platform):

```bash
bun install --frozen-lockfile
(cd e2e && bun install --frozen-lockfile && bun x playwright install chromium)
(cd verification && bun install --frozen-lockfile)
VITE_SUPABASE_URL=http://127.0.0.1:54321 VITE_SUPABASE_PUBLISHABLE_KEY=synthetic-public-fixture bun run build
(cd verification && GRIDMIND_CASE_BROWSER=1 bun run test)
(cd e2e && bun run test:synthetic)
```

The runner starts only an ephemeral loopback PostgreSQL cluster and rejects remote database configuration by not accepting any DB URL. The browser blocks external requests. The public fixture key is invented; never substitute a service-role key into the build command. The optional browser run requires the fixture build above. `cd verification && bun run test` runs database acceptance alone.

For a separately authorized **isolated Supabase** environment, apply/reconcile the migration there first; supply public client settings and the server-only variables in [`.env.example`](../.env.example), setting `GRIDMIND_CONNECTED_CASES_ENABLED=synthetic-only`. Provision actual Auth users and canonical organization/factory membership through approved setup, then use `/investigations-connected`. Never enable this against production as part of the Lovable design handoff.

**Delivered:** offline method workflow, connected synthetic backend source, minimal connected controls, repeatable verification and sourced design handoff. **Still required for customer use:** isolated complete API/Auth/PostgREST/browser acceptance, independent security/migration review, live schema/function reconciliation, authorized secure file custody, qualified methodology review and buyer evidence. The commercially usable customer-data MVP is not complete; only the Git-created preview described above is verified, with no production promotion.

**Lovable next:** refine both interfaces using the reference table while preserving behavior and tests. **Codex next after applicable gates:** resolve any isolated full-stack acceptance failures, obtain independent security/migration review and complete the real-case contract/file-custody work in issue #104. Do not declare pilot readiness from synthetic exercises or green CI.
