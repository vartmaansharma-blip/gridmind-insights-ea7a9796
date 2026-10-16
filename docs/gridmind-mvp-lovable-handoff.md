# GridMind internal MVP — implementation and Lovable handoff

**Status:** Supporting implementation contract for [issue #105](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/105), 16 October 2026. The [Master Plan](gridmind-master-plan-2026-10-11.md) dated build exception is authoritative. This is not a second roadmap or a pilot-readiness claim.

The [supplied blueprint](gridmind-mvp-build-blueprint.md) is preserved as supporting requirements. Offline generated examples are in [`data/synthetic-investigation`](../data/synthetic-investigation/README.md); reproduce them with `bun run demo:brief`.

## Integration plan — retain the Lovable dashboard

**Requested and authorized on 16 October 2026. Status: integrated source implementation for isolated synthetic acceptance; not a production/customer-data release.** The founder requested the integration plan, then instructed us to implement it, store it in GitHub and minimize human touch. Preserve the existing Lovable dashboard. Refs [issue #107](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/107) and draft [PR #106](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/106). The unused empty migration draft from the earlier planning pass was removed without application; the later source migration below is separately validated.

### 1. Product structure

Keep **one GridMind application, one shared dashboard design, and one investigation case**. Three areas serve different people:

| Area | Purpose | What belongs here |
|---|---|---|
| Public website | Explain the service and begin a scoped conversation | Problem/decision examples, process, clearly labeled sample brief, trust and limitations, enquiry and sign-in |
| Customer view of the existing dashboard | Help the customer understand progress and make their decision | Assigned cases, scope, requested evidence, shared messages, released brief, decision and follow-up |
| Team view of the existing dashboard | Produce and deliver a defensible investigation | Intake, case assignments, evidence reconciliation, existing analysis, working findings, independent review, publication, internal economics |

**Shared journey:** website → authenticated scoped request → team scope authorization → automatically created case and customer grant → customer evidence response → team verification/analysis → independent review → automatic publication when pre-authorized → customer decision → outcome follow-up.

An enquiry is not automatically an accepted engagement. A customer submission is not automatically verified evidence. An accepted review publishes automatically only when the manager authorized that policy at scope acceptance and the current revision passes the release checks. A published brief is not automatically an implemented action or verified saving.

### 2. What we already have and where it fits

This mapping is based on the repository inspected at `a7ee358cd84136d6925bc26c2d1a78d138b5d230`; it is not an audit of unmerged edits in the Lovable editor.

| Existing source / route | Retain | Integration change |
|---|---|---|
| `src/components/gm/app-shell.tsx` | Logo, sidebar, header, mobile navigation, tokens and overall dashboard design | Extract reusable presentation from factory-store behavior. Supply customer/team navigation and the appropriate case/company context. |
| `src/routes/index.tsx` — `/` | Current operational overview and its existing behavior | Add a case-summary entry point for authorized team users. Keep operational estimates labeled; do not feed unreleased investigation findings into headline financial cards. |
| `/factory`, `/energy` | Existing monthly data entry and energy views | Link permitted records to an explicit case boundary. Preserve their current screening role until the facility/asset method contract is repaired. |
| `/machines`, `/machines/$id` | Machine identity, source mappings, observations and existing authenticated asset analysis | Add a scoped “Investigate” entry that references the selected asset; preserve the asset analysis method and its provenance. |
| `/opportunities`, `/alerts` | Persisted opportunity/deviation views and evidence references | Allow an authorized user to open a case from a selected record. A case finding does not automatically create an opportunity. |
| `/savings` | Intervention, verification-run and outcome records | Link case decisions to the existing verification workflow. Display verified value only after that workflow establishes it. |
| `/auth` and Supabase client | Current Auth integration and session handling | Resolve customer/staff/reviewer permissions on the server and route to the appropriate view; no client-selected role. |
| `/investigations` | Existing offline synthetic exercises and recovery tests | Retain as a clearly labeled internal/demo tool. It is not the production customer dashboard or customer data store. |
| `/investigations-connected` | Authenticated case commands, evidence controls, review, economics and history | Reuse these behaviors inside dashboard case pages. Keep this route working during transition; avoid a second independently maintained workbench. |
| `src/lib/investigation/*` | Schemas, deterministic engine, fixtures, review binding and export logic | Keep as the common method layer. Add customer projections/publication contracts around it; do not duplicate calculations in dashboard components. |
| Existing investigation SQL/API | Atomic saves, scoped staff assignments, safe retries, immutable snapshots and hashes | Extend with a separate customer boundary, communications and publication. Do not expose the existing full case snapshot to customers. |

### 3. Navigation and route plan

**Preserve every existing route and the dashboard root `/` during integration.** The routes below are implemented; finer specialist-record links and richer list summaries remain proposed refinements as noted below.

| Audience | Proposed navigation | Route plan |
|---|---|---|
| Public | Service · How it works · Sample brief · Request a conversation · Sign in | Build public preview at `/website` first, preserving the current dashboard root. Marketing-domain/root promotion is a later hosting decision; do not relocate `/` in this pass. |
| Customer | Overview · Investigations · Evidence requests · Briefs · Account | `/cases` is the customer case overview; `/cases/$caseId` has Summary, Evidence, Messages, Brief and Decision/follow-up tabs. |
| Team | Existing dashboard navigation + Investigations + Intake; Reviews filtered within Investigations | `/team/intake`, `/team/cases`, `/team/cases/$caseId`; case tabs reuse existing scope/evidence/analysis/findings/review/brief/outcome/economics/history controls. |
| Reviewer | Assigned cases · Review | A restricted version of the team case page with the current reviewer permissions; no management/economics controls. |

A customer case card shows the decision question, site/window, current stage, next action and last update. The team case list adds assignee, blockers, review state and delivery stage. Use meaningful counts derived from permitted cases; no invented savings, staff activity or completion percentages.

Preserve existing asset/energy routes for authorized operational users. Customers with case-only access land on `/cases`; they must not be prompted to create a factory or initialize the staff factory store. The present root provider initializes `EnergyStoreProvider`, while the investigation routes bypass the shell. Integrating these routes requires separating shared layout from these data-loading behaviors, not simply putting the whole workbench inside the current provider.

### 4. Customer and team permissions

| Capability | Customer | Investigator | Assigned reviewer | Manager |
|---|---|---|---|---|
| Read case | Own assigned case, restricted projection | Assigned case | Assigned case | Authorized factory cases |
| Agree scope / provide response | Own scope response | Prepare scope | Read scope | Manage scope/assignment |
| Respond to evidence requests | Submit references/files through approved custody path | Reconcile and verify | Review/verify within assignment | Manage workflow |
| Edit calculations, hypotheses, internal notes | No | Yes | Existing read-only/review boundary | Yes, subject to review gates |
| Review findings | Read published result only | Cannot independently approve own work | Record review within competence and assignment | Assign reviewer; no self-approval shortcut |
| Publish / withdraw a brief | No | Prepare candidate | Review candidate | Explicit release after required review/gates |
| Internal labor, expenses, margins | No | Authorized internal access | No | Authorized internal access |
| Record customer decision | Own recorded decision | Preserve and follow up | Read relevant response | Preserve and follow up |

**Critical boundary:** current investigation access requires `factory_members` plus active organization membership. That is a staff-oriented permission path, and legacy operational screens also use factory membership. Do not add customers as broad factory viewers merely to make case access work. Add case-scoped customer grants referencing existing case/factory/organization identity, with activation, expiry and revocation. They must not implicitly grant legacy operational-table access.

The customer API returns an explicit allowlist: case identifier/question, agreed scope/site/window, public stage, evidence requests and receipts, shared communication, published brief/version and customer decision/follow-up. Exclude raw technical snapshots, internal hypotheses, reviewer deliberations, cost/margin records and internal audit details. Enforce this on the server and database; navigation hiding is presentation only.

### 5. Shared case, evidence and publication contracts

Reuse existing `investigation_cases`, `investigation_revisions` and staff assignments. The eight investigation objects remain in their versioned snapshot. Add only workflow records required by the customer boundary:

- **Intake request:** requester, non-confidential question/site/category, requested window, contact/account linkage, triage state and accepted case ID. Staff acceptance establishes the authoritative factory and scope; customers cannot supply a foreign factory ID to grant themselves access.
- **Case-scoped customer access:** authenticated customer, case, permitted actions, active/expiry/revocation state and grant actor. Avoid a parallel tenant model.
- **Evidence requests and submissions:** requested item, requesting actor, source requirement, customer response/file reference, received time and reconciliation state. Customer response remains unverified until an authorized staff command verifies it.
- **Shared messages:** explicit customer-visible channel, author, case/request linkage and timestamp. Internal notes remain in internal records; do not reuse a public channel for review deliberations.
- **Publication record:** exact case revision, method version, reviewed-content binding, reviewer record, released customer projection/document hash, releasing actor/time and withdrawal/supersession. Customer decisions bind to the specific released version.

Publication sequence: manager authorizes automatic release at intake acceptance → prepare candidate → independent assigned reviewer accepts → current revision and review gates pass → publish the safe projection in the same transaction. If automatic release was not authorized, a manager explicitly publishes the reviewed current revision. Corrections retain the old publication and withdraw/supersede its current status; the changed case must pass review/release again. Customers can distinguish “awaiting review”, “brief available”, and “updated brief pending”. A simulated review never becomes real professional approval by changing a UI label.

The current case schema accepts only `origin: synthetic` and review records require `simulated: true`. Real-case support is a separate, explicitly validated contract extension with data rights and actual review attestations; it must not be enabled by silently relaxing these literals.

**File custody is required before actual source uploads:** private storage, case-specific authorization, server-generated object keys, allowed type/size limits, quarantine/content checks, short-lived scoped download access, version/hash metadata, retention/deletion and audit records. Do not offer a working-looking upload that saves only to the browser or marks documents verified automatically. Provider/scanner details must be selected and tested before advertising file handling.

### 6. Preserve the existing analysis boundaries

The known #104 gap remains: monthly factory input and the authoritative asset-only Edge method have different scopes. A new dashboard must not conceal that gap.

- Every case declares facility meter, process or physical asset boundary, source IDs, units and relevant method.
- Linking an existing bill/observation to a case preserves its original scope and identity; it does not relabel factory totals as asset observations.
- C4 synthetic period arithmetic and the existing asset analysis remain distinct until a supported method contract joins the intended inputs and output.
- C1 uses the existing source-linked chronology and clock gates. No monthly-chart inference of downtime cause or physical failure.
- Working findings stay in the team area. Released observations/limitations are the customer deliverable. Opportunities, interventions and verified outcomes retain their own canonical records and links.

### 7. Build order and acceptance gates

| Slice | Implementation | Done when |
|---|---|---|
| 1 — Blend the team investigation into the dashboard | Extract reusable shell presentation, retain current staff/energy adapters, add case list/detail navigation and embed existing controls without duplicating the engine | Existing routes still work; a team user opens the same persisted case/revision from the dashboard, edits it, reloads it and sees unchanged validation/history |
| 2 — Add the customer boundary | Case-scoped customer grants, server projection, principal-based routing and customer case list/detail | Two customers cannot see each other's cases; case-only users cannot read legacy operational tables, internal snapshots or economics; expiry/revocation works on subsequent requests |
| 3 — Complete customer/team hand-offs | Scoped intake, evidence requests/replies, shared communication and staff reconciliation | An intake becomes one accepted scoped case; customer response appears for staff; source verification remains a separate audited action; retries do not create duplicates |
| 4 — Deliver the brief | Exact-revision review/publication, customer preview/download and decision response | Only the released projection is visible; unpublished/rejected/stale cases cannot expose draft briefs; a correction supersedes the publication; customer decision identifies the version read |
| 5 — Add the public front door | Match current branding, process/sample pages and minimal enquiry/sign-in navigation | A visitor reaches the right intake/auth path; a sample is labeled; no confidential upload, invented testimonial, unvalidated price or unsupported claim |
| 6 — Validate the integrated MVP | Existing regressions plus authenticated cross-role browser/API/storage acceptance; responsive/accessibility checks and preview verification | One complete customer/staff/reviewer journey passes on an exact SHA; no current dashboard/analysis route is broken; migration/security review and applicable release gates are evidenced |

Start with slice 1: the existing dashboard and investigation workspace become one coherent team journey. This preserves useful work and establishes the shared case navigation before opening customer access. Public-site polish does not block the permission/publication work.

### 8. Minimum complete journey to demonstrate

1. Visitor understands the bounded offer and opens an enquiry/sign-in path.
2. Team triages the request, accepts scope, creates the case and assigns the customer/analyst/reviewer.
3. Customer sees their case and responds to a specific evidence request.
4. Analyst reconciles evidence, runs the appropriate existing method and records findings/unknowns.
5. A distinct assigned reviewer accepts, requests corrections or rejects the current content.
6. The system publishes the exact reviewed customer-safe brief automatically if the manager pre-authorized release; otherwise the manager releases it. The customer opens/downloads it.
7. Customer records their decision/question; team records follow-up and measured outcomes only when evidence exists.
8. Refresh/re-login retains the state, and another customer cannot access the case by changing its ID.

Run this with invented fixtures first. A production/customer-data launch needs the existing independent review, live schema/function reconciliation, data authorization/custody and real professional/delivery gates in addition to a working interface.

### 9. Work split and scope limits

**Founder clarification, 16 October:** Lovable owns public/customer/team visual design, layout, responsive presentation and interaction polish. Codex owns workflow automation, evidence/data contracts, API/database behavior, permissions, reliability, deterministic methods, integration tests and repository delivery. Preserve existing screens while strengthening their contracts. This is an execution split, not another plan.

**Backend reliability follow-up — issue #109:** the shared command transport freezes the command bytes/receipt identity, retries safe reads and receipt/CAS-backed writes after transient network/gateway/throttle failures, refreshes same-account credentials per attempt, and stops on account changes. Recovery is bounded to three HTTP attempts with eight-second per-attempt timeouts and short backoff. Authorization, stale revision, validation and missing configuration errors are not retried. Long Retry-After values stop rather than retry early. Customer grant changes have no receipt/CAS contract and are not automatically replayed. Acknowledged writes remain saved when a following refresh fails; the existing periodic refresh recovers the view and clears its refresh notice. The server classifies temporary PostgreSQL/PostgREST connection, capacity and timeout failures as a generic recoverable 503, and returns only allowlisted permission/conflict errors; SQL details remain private. No payload/token is added to persistent storage. Lovable can change presentation around these behaviors without replacing the transport or weakening the request identity/permission checks.


**Lovable:** preserve/refine the existing dashboard shell, navigation, responsive case pages, stage/evidence/request presentation, customer brief reading experience and public-site visuals.

**Codex:** principal/role resolution, case adapters, typed API contracts, customer projections, scoped permissions, intake/communication persistence, source custody, exact-revision publication, method boundaries, migrations/tests and repository integration. A frontend that looks connected is not a substitute for these contracts.

MVP priority is the complete case journey. Defer autonomous diagnosis/AI-generated findings, broad predictive monitoring, unrelated dashboard metrics, automatic savings claims, complex billing automation and parallel tenant frameworks. Existing specialist views remain available; they are not deleted or rebuilt merely because they are outside the first customer journey.

### 10. Implemented integration and automation

| Area | Implemented source behavior |
|---|---|
| Public `/website` | Existing branding, bounded process, labeled sample brief, sign-in/request and sample workspace entry |
| Customer `/cases`, `/cases/$caseId` | Case list/search, scoped request, shared evidence references/messages, current safe brief/download and version-bound decision |
| Team `/team/intake`, `/team/cases`, `/team/cases/$caseId` | Authorized intake acceptance, shared case, existing workbench embedded in the dashboard, customer grants and delivery controls |
| Shared Lovable shell | Reusable dashboard presentation; old `/`, factory, energy, machine, alert, opportunity and savings behavior retained |
| Backend `/api/portal` | Verified non-anonymous Auth, server-owned organization routing, case-only customer grants, allowlisted responses and atomic workflow RPC |
| Persistence | `20261016125814_dashboard_case_integration.sql`: intake, grants, shared communications and immutable publications; no direct browser table writes |
| Automatic handoffs | Atomic case creation/customer grant on accepted scope; receipt-based safe retries; atomic publication after accepted independent review when authorized; automatic stale-publication exclusion after correction; visible-page status refresh every 20 seconds |

**Minimal human touch:** automate mechanical routing, persistence, document assembly, current-version checks and authorized release. Retain scope/data-rights authorization, actual source verification, independent technical judgment and customer action decisions. Customer replies never verify themselves. This synthetic implementation keeps `origin: synthetic` and `simulated: true`; it does not establish real professional approval.

**Verified locally:** 130 unit tests, TypeScript, semantic lint (eight existing warnings, zero errors), production build, nine production browser scenarios, and native PostgreSQL replay of 35 migrations with case/customer access and publication acceptance. Native PostgreSQL uses an Auth-schema fixture; real Supabase Auth/PostgREST/browser acceptance runs separately in CI. The PR records exact-head CI/deployment evidence; a preview does not enable the connected feature flag.

**Still required before real customer use:** private source-file custody/scanning/retention, a real-case/reviewer contract, independent security/migration review, production drift reconciliation, explicit data authorization and the existing release gates. Evidence submission currently accepts references and explanatory text only. No file uploader or external notification sender is advertised. Specialist-record-to-case links, detailed assignee/next-action list summaries and outcome-to-verification links in the mapping above remain future adapters; the existing specialist screens and method boundaries are retained. The #104 monthly-factory/asset-only method mismatch is not repaired by this integration.

**Lovable handoff:** refine these editable pages and shared dashboard components without changing the API contracts, safe projection, role boundaries or existing operational flows. No replacement framework, generated integration rewrite or history rewrite is needed.

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
