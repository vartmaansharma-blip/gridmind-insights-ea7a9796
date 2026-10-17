# GridMind 3.1 — PR #136 pre-merge decision packet

**Date:** 17 October 2026. **Status:** **HOLD — decision framework / evidence checklist, not release approval.**  
**Scope:** [PR #136](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/136) into `main` of the **existing public** `vartmaansharma-blip/gridmind-insights-ea7a9796` repository.  
**Authority:** [Decision Constitution](../gridmind-decision-constitution-and-contradiction-register-2026-10-10.md) (§ G31-M01–M10), [Master Plan](../gridmind-master-plan-2026-10-11.md), [Buyer Discovery Sprint](../gridmind-buyer-discovery-sprint-2026-10-11.md), [Release Gate](../release-gate.md). This packet supports a *one-time merge decision*, not an independent roadmap or commercial backlog. Linked blockers remain in existing issues.

## 1. First question: exactly what will merge into production?

A merge to `main` is potentially a **Vercel production deployment**; GitHub is not a safe archive for unapproved source. The PR spans 200+ changed files with document relocation, public-site messaging, synthetic case preview and security/tenancy/migration/Edge Function source. **No assertion that every line was independently reviewed is warranted.** Before merging, the named release owner must decide and record one of:

- **Option A — Separate informational release (preferred for reducing blast radius).** Build a *fresh, narrow branch* from the up-to-date `main` and selectively carry only founder-approved safe `/website`, contacts, route tests and canonical non-sensitive docs. Preserve public branch history; do **not** force-push/rebase the Lovable-connected branch. Re-run exact-head checks on the *new* PR and review its isolated diff. Leave risky case/tenancy/migration changes in #136 draft. Even this release needs reviewed claims, contact receipt, Vercel deployment proof and rollback.
- **Option B — Keep single large #136 release.** Justifiable only if every affected permission, migration, Edge Function, public route, synthetic UI and linked data contract receives a recorded security/code review, all required checks pass on its final SHA, the connected production route/deployment is intentionally authorized, and a tested containment/rollback path exists. **Not currently demonstrated.**
- **Option C — No production change.** Continue synthetic work and commercial discovery on draft branch. This is the default when dependencies cannot be satisfied without taking unnecessary risk.

**Present recommendation: C now; prefer A if an informational website release is urgent.** No automatic timeline. A can change the PR map and requires explicit branch-overlap review, not cherry-picking migrations blindly.

## 2. Three release classes — approval is not transitive

| Class | Permitted release | Mandatory evidence | Unacceptable interpretation |
|---|---|---|---|
| **I — Public informational site** | Truthful `/website`, fictional examples, **non-confidential** contact request, existing authenticated deep links unchanged | Claim-to-evidence review; founder-approved recipient/consent; browser/mobile/keyboard tests; exact-SHA Vercel preview and intentional live route check; rollback | “Real product launched”, “quality analysis proven” or “paid client ready” |
| **S — Internal synthetic case demo** | Test-only R1/R2/R3 triage and existing C1/C4 synthetic pipeline, isolated test data and restricted test roles | Tests of missing scope/permission, cross-tenant access, stale versions, reviewer denial, no hidden real-data ingestion; release environment isolated and data labels visible | Live industrial certification, autonomous diagnosis or reviewer approval |
| **D — Production data/customer workflow** | Case storage, uploads, real factory evidence, reviewer/customer publication after formal gates | Business permission and retention; issue #130 migration history and backup; issue #29 populated tenant/authenticated negative tests; competent independent review; rollback and incident plan; authorized product offering | Infer approval from Class I/S or green CI |

**Current decision: Class D = NO-GO.** Even if an informational Class I change lands, real-case feature flags, production schema mutation and customer data are prohibited without a distinct authorization packet.

## 3. Blocking decision questions with evidence required

| Key | Question that must be explicitly answered | Gate / source | Who records it | Current answer |
|---|---|---|---|---|
| **P01 Scope** | Is this a single-purpose site/docs release, or are migrations and tenant/Edge Function behavior actually shipping? What files will reach `main`? | PR compare, all 200+ filenames classified by code owner; diff and dependency map | Engineer + founder | **Open** |
| **P02 Risk** | What happens on merge automatically (production build, DB calls, live root route, secrets, feature flags)? Which environments are truly isolated? | Vercel project/deploy target and env-variable **names only**, source route/auth inspection, prod rollout plan | Engineer | **Open** |
| **P03 Production data** | Does target Supabase contain real/customer or other third-party data, and who has rights? Is the source migration order consistent with DB registry (including parked scooter migration)? | Read-only production inventory, permissioned classification, approved forward-only plan under [#130](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/130) | Authorized data owner + independent reviewer | **NO-GO / open** |
| **P04 Tenant/security** | Can principal A read, update, approve or publish factory B case? Can a caller spoof case role/scope, reviewer revision or source status? | Populated two-tenant authenticated positive/negative tests, fail-closed RBAC/RLS, replay/retry under [#29](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/29) | Engineer + competent independent reviewer | **Open** |
| **P05 Public claims** | Can a cold factory buyer distinguish an unvalidated pilot, fictional quality case, human review plan and current capabilities? | Line-by-line claim table and founder approval; compare /website to working backend | Founder + design reviewer | **Open** |
| **P06 Contact safety** | Does the call-to-action lead to a real operated non-confidential request with consent, privacy notice, intentional recipient and clear failure state? | Manual request-to-receipt acceptance; do not test with factory records | Founder + engineer | **Open** |
| **P07 Exact checks** | Did CI, Quality, Public Site Browser, local isolated Migration Replay and required Vercel status pass on the **final** commit? | Five URL/commit match proofs; no skipped/zero-step runs | Engineer | **Must refresh after every commit** |
| **P08 Preview/prod parity** | Does Vercel preview match final SHA and is production promotion intentional? What if Vercel quota prevents a matching preview? | Deployed SHA, preview URL, browser routes + logs, quota evidence | Engineer + founder | **Open until verified** |
| **P09 Independent review** | Have tenant/migration/Edge changes been reviewed by a competent **different** person? Is review scope and dissent preserved? | Named private reviewer reference, scope, date, risk decision, unresolved comments; never fake GitHub approval | Independent reviewer | **Not recorded** |
| **P10 Overlap** | Have [#132](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/132), [#133](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/133), [#125](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/125), and [#120](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/120) been reconciled without duplicate routes/migration versions? | Diff-based keep/park/port/supersede rationale on original PRs | Engineer | **Open** |
| **P11 Revert/contain** | Can the changes be stopped safely if the site fails, tenant leak appears or migration goes wrong? | Prior live SHA, preview and config baseline, rollback or forward-fix procedure, emergency contacts; backups if DB changes | Engineer + authorized operator | **Open** |
| **P12 Authorize** | Has founder explicitly approved **this exact** scope/commit/target and approved messaging? | Timestamped approval recorded on PR after reviewer evidence; customer data requires separate authorization | Founder | **Not provided by requesting commits** |

**Hard stop conditions:** incorrect claims; unknown owner of data; exposed customer content or secrets; wrong tenant authorization; migrations applied outside a reviewed forward-only plan; unavailable qualified technical judgment when required; failed required check; unresolved production/case exposure; unreviewed source diff; missing fallback. **Do not downgrade gates to green the PR.**

## 4. Manual validation matrix for the target commit

Record actual URL, timestamp, tester and SHA; **not** “tested in general”. Use non-sensitive fictional values.

| Journey | Test for Class I | Additional Class S / D requirement |
|---|---|---|
| Anonymous `/website` | Visible with correct green, copy, mobile widths, focus, reduced-motion and no real-data prompt | No unguarded case data |
| Non-confidential contact | Recipient receives consent-safe test request, success/error/timeout truthful, no made-up reply time | No unsolicited personal/confidential source upload |
| Public synthetic example | Clearly fictional R1 example; no implied evidence-quality or ROI proof | State machine cannot mark a missing-review case as completed |
| Signed-in staff/customer | `/` and existing deep links preserve intended roles; logout/expired session denied | Two populated factories deny cross-read, update, assignment and publish |
| Source & analysis | No external upload or machine connection triggered by demo | Scoped custody, hash/revision binding, source mutation rejects stale approval |
| Billing/quality/receivables | Candidate descriptions remain hypothetical and bounded | Qualified domain-specific method mandatory before real conclusions |
| Failures/rollback | 404, loading, malformed input and broken contact show safe message; previous SHA recoverable | DB/migration backup, reversible flag rollout, audit and incident response |

## 5. Overlapping PRs — explicit decision required, not silent auto-merge

- **#132 root/onboarding:** **Hold.** It changes root and authorization contract. Revisit only after focused role/deep-link, preview and case migration tests.
- **#133 case-analysis bridge:** **Hold.** Overlaps case persistence; compare append-only references/migrations to #136 and do not enable real customer data.
- **#125 previous Lovable enquiry:** **Supersession review.** Retain useful static design/browser tests only if isolated; do not produce competing contact links.
- **#120 scooter reference:** **Park.** Retain documented data and reconciliation obligation for its separately registered production migration; unrelated to industrial MVP.
- **#134 C1/C4-first research:** Closed/unmerged; strategically superseded by neutral R1/R2/R3 discovery.

Any changes to these dispositions must be documented on the original PR/issue with a testable reason. Do not conflate “open”, “merged”, “deployed”, “in production database”, and “commercially operating”.

## 6. Acceptance / actual decision record (fill only when evidence exists)

**Target PR / source head:** #136 / **NOT YET APPROVED FOR MERGE**  
**Target environment:** main-connected Vercel production — **impact review needed**  
**Scope selected:** Option A / B / C = **C (hold) provisional recommendation**  
**PR final SHA:** _not yet frozen_  
**CI / Quality / Browser / Migration / Vercel checks:** _link results on final SHA_  
**Independent review:** _name/scope/date/findings not recorded_  
**Source migration + tenant authorization:** _blocked by #130 / #29_  
**Buyer verification:** _not a technical merge gate for honest informational material; sole tracker owns evidence_  
**Founder release decision:** _not yet recorded_  
**Revert / rollback practice:** _not yet demonstrated_  
**Disposition:** **HOLD.** Do not merge, tag as customer-ready or change live database permissions.

If and only if all gates applicable to the selected release class are proven, the authorized reviewer may record **GO / NO-GO / NARROW SCOPE** along with exact commit, checks, target, approver roles, unresolved noncritical risks and rollback owner. **A fictional reviewer entry never constitutes approval.**

## 7. Strategic decisions to defer deliberately

Do **not** block a truthful site on deciding a billion-dollar valuation, full asset ontology, every sensor type, chip/data-centre/power-grid entry, foreign incorporation or final pricing. These choices do not change the security or release decision today. Actual R1/R2/R3 buyer interviews, independent delivery capability and per-case cash economics should govern whether to commercialize and specialize software later.

**Links:** [exact checkpoint register](gridmind-3-1-exact-checkpoint-and-integration-register-2026-10-17.md) · [engineering implementation acceptance](gridmind-execution-and-repository-acceptance-2026-10-17.md) · [site and CTA acceptance](../product/gridmind-site-build-and-acceptance-2026-10-17.md).
