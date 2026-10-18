# GridMind 3.1 — Exact checkpoint and integration register

## Integration scope correction — 18 October 2026

Refs #137, #136, #138, #29 and #130. The founder requested resolution of #136 and consolidation into main only when legitimate gates pass. The current integration merges main `8cf121ca4f8a8e8d0709941b62f2640686c6e6cd` into original source `42ec9e2143f837c714c8d96d5dee6ad2babc2c9c` with a merge commit; no published history is rewritten.

**Selected scope: documentation consolidation and isolated-test tooling only.** All `src/`, `supabase/`, `e2e/`, application dependency/build configuration and public/root routes are retained byte-for-byte from current main. #140 research and #142 synthetic Resolve behavior, additional negative tests and accessibility fixes are retained. The only executable change is pinning the isolated replay workflow's Supabase CLI from `latest` to `2.121.0`; this workflow starts and resets only its disposable runner-local stack. No production migration job is added.

The proposed website copy is deferred to #138 and remains recoverable at source commit `42ec9e2`; it is not shipped by this integration. No contact receipt, qualified review, savings or customer outcome is asserted. #132 root/onboarding, #133 case bridge, #125 older enquiry and #120 scooter reference remain separate and unmerged; this candidate imports none of their branch-only changes. Existing seven factory records and production drift recorded in #130 are not read or mutated by this task. They are not assumed fictional.

**Gate applicability:** G31-M03/M06 security review remains mandatory for any future permission, migration or server-function change; this narrowed diff contains none. #29/#130 remain open and Class D remains NO-GO. This correction supersedes earlier descriptions that #136's remaining diff includes tenant/migration/Edge code or releases revised website copy. It does not waive any gate for those deferred changes. Normal exact-head CI, Quality, Public Site Browser, isolated Migration Replay, Vercel preview and resolved-conversation protections still apply. Keep draft until those checks and preview evidence are recorded on the PR.

**Containment and rollback:** application/backend tree equals main baseline `8cf121c`; no data rollback is needed. If documentation or CI pin causes a problem after merge, revert the integration merge with a new reviewed commit (`git revert -m 1 <main-merge-sha>`), validate it and merge normally; never reset/force-push or execute down migrations. Verify the reverse patch restores the baseline tree before merging. The PR evidence comment records candidate SHA, exact check URLs, preview, review findings and final disposition; this source note does not predeclare success.

---

**Historical snapshot below; current integration scope is defined above.**

**Date:** 17 October 2026. **Class:** Supporting point-in-time release/integration record, not a second plan, commercial tracker or backlog. **Baseline:** Draft [PR #136](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/136), head **208747c43ee6ab68a501aeaf6b547ae5339a5942**. **Owner:** founder for business/release approvals, engineering maintainer for source and acceptance, qualified specialist for professional findings. **Important:** after any new commit, exact-head checks and Vercel preview must be repeated. This file records the recovered checkpoint, not continuously live status.

## A. The product being built, and the proof missing

GridMind is one founder-led, on-site, expert-assisted **Industrial Profit & Resolution Intelligence** company. Its proposed loop is authorized factory exception → bounded case and source permissions → observations separated from hypotheses → appropriate human expert review → customer-approved action → outcome and economics verification. It is **not** a QMS/ERP replacement, industrial machinery controller, debt collector, electricity auditor, regulated finance provider or autonomous root-cause certifier.

The first commercial service is **not selected**. **R1** = quality/rejection plus related C1 downtime; **R2** = acceptance/invoice evidence disputes (C6); **R3** = electricity bill/contract exposure (C4). R1 is preferred for the **fictional design demonstration**, not established willingness to pay. Buyer interviews, paid customers, qualified reviewer commitments, confirmed factory access, customer-data permission and verified savings remain **zero/unverified**. The initial ASIA inquiry reportedly sent 12 October is not an interview or introduction.

The current source uses TanStack Start, React, Vite and Bun; Lovable supports design, Supabase supports data/auth source, GitHub manages reviews/checks, and Vercel handles deployment. It preserves synthetic C1/C4 logic and an R1/R2/R3 non-persistent preview. The production R1/R2 professional engine and real customer case-to-outcome workflow are **not built/verified**.

Authority remains with the sole [Master Plan](../gridmind-master-plan-2026-10-11.md), sole live [Buyer Discovery Sprint](../gridmind-buyer-discovery-sprint-2026-10-11.md) and binding [Decision Constitution](../gridmind-decision-constitution-and-contradiction-register-2026-10-10.md). Do not create a parallel roadmap or duplicate the live customer evidence in this file.

## B. Verified exact-head state

| Item | Verified status at baseline head 208747c | Evidence / limitation |
|---|---|---|
| PR #136 | **Open, draft, unmerged**; GitHub reports mergeable=true | [PR #136](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/136). Mergeable does not mean independently reviewed or released. |
| GitHub CI | **Passed** | [Run 39035496754](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/39035496754): docs links, typecheck, lint, tests and build. |
| Quality Gate | **Passed** | [Run 39035496773](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/39035496773). |
| Public Site Browser | **Passed** | [Run 39035496767](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/39035496767). Fictional workspace / no-real-records warning exercised. |
| Migration Replay | **Passed in an isolated local environment** | [Run 39035496772](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/39035496772). This is NOT proof of safe production migration. |
| Vercel exact-head preview | **Blocked: build-rate limit** | GitHub combined status = failure pointing to [Vercel build limit](https://vercel.com/vartmaansharma-blips-projects?upgradeToPro=build-rate-limit). Earlier READY preview applies to a different head, 3c4586d8d644dc7af5141f14c7c64cef47b826ae. |
| Connected production/customer use | **NO-GO** | Production Supabase schema/migration mismatch [#130](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/130); real authenticated tenant and release acceptance [#29](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/29). |

The **same existing repository is public** by founder direction on 17 October after private GitHub Actions budget exhaustion; it has not been licensed for open-source reuse. Do not open a second repository or put confidential factory records, personal details, financial contracts, credentials or secrets into the public repo, Git history, PRs or issues. An alert-free secret scanner is not conclusive proof of clean historical content.

## C. One cohesive project — file/domain ownership map

| Concern | Existing authority | Implementation / test surface |
|---|---|---|
| Problem statement, ICP, why pay, buying committee, offers, economics and expansion gates | [Master Plan](../gridmind-master-plan-2026-10-11.md) | [Operations economics/risk](../operations/gridmind-company-economics-and-risk-register-2026-10-17.md); [first-case schedule](../operations/gridmind-first-paid-case-scope-template-2026-10-17.md) |
| Customer research, access, interview counts, scorecard and 10 November decision | [Buyer Discovery Sprint](../gridmind-buyer-discovery-sprint-2026-10-11.md) | Only actual permissioned interviews and next steps; no speculative pipeline |
| Authorization, evidence integrity and scope changes | [Decision Constitution](../gridmind-decision-constitution-and-contradiction-register-2026-10-10.md) and [Release Gate](../release-gate.md) | Role/tenant negative tests, code review, issues #29 and #130 |
| Cases, roles, reviewers, states, R1/R2/R3 method contracts | [Resolve Domain Contract](../product/gridmind-resolve-domain-and-product-contract-2026-10-17.md) | src/, data/synthetic-investigation/, tests/; specialized engines conditional |
| Public story, site pages, signature green, non-confidential contact | [Site Build & Acceptance](../product/gridmind-site-build-and-acceptance-2026-10-17.md) | /website, issue [#138](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/138), browser checks and deployed SHA |
| Backend, migration/tenancy, CI, release and rollback | [Engineering Acceptance](gridmind-execution-and-repository-acceptance-2026-10-17.md) | supabase/, scripts/, .github/workflows/, issues #29/#130 |
| Past ideas and rejected directions | [Archive](../archive/README.md) | Git history and compatibility pointer files; never another active master plan |

Existing dashboard remains at **/**, with public site at **/website**, until a separately authorized/tested route change. Preserve the established GridMind signature green and Lovable history; do not force-push or rewrite published commits.

## D. Unresolved integration/merge dependencies

1. **REL-1 — Vercel quota.** Check actual project plan/build allowance and account eligibility, restore a real exact-head preview, confirm deployed SHA, responsive page, non-confidential CTA and browser errors. Do not bypass the required Vercel status or claim an older READY deployment is the new build.
2. **REL-2 — PR #136 independent review.** This is more than documentation: it includes tenancy/migration and Edge Function changes. A qualified security/authorization reviewer must inspect the exact diff, tenant boundaries, publishing controls, source permissions and rollback plan. Passing four workflows alone does not authorize merging.
3. **REL-3 — Supabase production history (#130).** Live DB contains seven existing factory rows and does not have the full case/intake tables. Its migration registry includes a scooter reference migration associated with an unmerged PR. Reconcile every live version to source in read-only mode; obtain backup, consent and a forward-only reviewed plan. **No direct DDL or case-flag enabling in production.**
4. **REL-4 — Authenticated negative acceptance (#29).** Use a separately authorized test environment with two populated factories and two principals; verify cross-tenant denial, case permission, persistence/reload/retry, reviewer independence and rollback. A local clean replay or a rendered login page is not a production acceptance test.
5. **REL-5 — Site #138.** Public content and fictional example already exist in #136 source; remaining work is exact-head preview, founder claims review, actual non-confidential contact receipt path, privacy/consent, keyboard/contrast/mobile/reduced-motion behavior and recorded review. A site click is not a verified buyer lead.
6. **COM-1 — Factory access.** Identify an actually consenting adult/professional to support external outreach; obtain legitimate introductions, then conduct the real 20-minute research interview. No industrial visit, customer document upload or financial engagement until appropriate permissions and oversight.
7. **DEL-1 — Expert delivery economics.** No independent technical reviewer is confirmed. Before charging for a professional conclusion, document scope, qualifications, independence, realistic turnaround, costs and customer-approved responsibility. Quotes are not collected revenue.

## E. Open PRs — do not merge overlapping product histories blindly

| PR | Current purpose | Required disposition |
|---|---|---|
| [#136](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/136) | Canonical GridMind 3.1 integration draft | **Keep draft** until quota, review, tests and release decisions. |
| [#132](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/132) | Public-root switch, onboarding, staff/customer navigation | **Hold**: distinct route/security decision. Do not move /website to / silently. |
| [#133](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/133) | Synthetic analysis-to-case reference | **Hold**: compare case and migration contracts against #136; no real-data enablement. |
| [#125](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/125) | Old Lovable contact-link preview | **Supersession review**: preserve useful tests/green; avoid duplicate CTA flows. |
| [#120](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/120) | Parked scooter component/sensor catalogue | **Park** as research, but reconcile live migration registry before production case schema changes. |
| [#134](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/134) | Prior electricity-first strategy | **Closed, unmerged**. Superseded by neutral R1/R2/R3 commercial discovery. |

For each overlapping branch: compare files and migration identifiers with main and #136; classify **retain / selectively port / supersede / park**, assign a reviewer, and record a reason in existing PR/issue. Do not force-push the Lovable branch. PR sequencing must follow tested dependencies and permissions.

## F. Immediate continuation: two parallel tracks

**Founder / commercial:** confirm outreach support, attempt genuine 3–5 warm introductions only when contacts exist, follow existing ASIA/public-route protocol, interview around one recent costly exception, distinguish current provider, economic buyer, feasible case rights, repeat need and explicit next step. Update *only* the Buyer Discovery Sprint. 19 October is an access test; 31 October a progress target; 10 November the Tier-1 decision gate, not an automatic commercialization date.

**Engineering / safe demo:** preserve current routes and working C1/C4 source; keep #136 draft; reconcile overlapping PRs; recover Vercel exact-head preview; verify R1/R2/R3 fictional case example and recipient-owned non-confidential contact; independently review tenant/Edge Function/migrations; keep customer-data and case enablement off.

**Next technical checkpoint:** a truthful, accessible /website demo at an **exact, independently checked commit** with functional safe contact and a matching preview; **no production case rollout**. **Next commercial checkpoint:** recorded actual access/interviews, without picking a wedge from aesthetics. These are different gates.

### Acceptance record to fill with actual evidence

- [ ] Current #136 head SHA, scope/diff and CI + Quality + Public Site Browser + Migration Replay results recorded at that SHA.
- [ ] Vercel quota cause and matching deployment SHA recorded, or explicitly marked BLOCKED.
- [ ] Independent security review of case/tenant/Edge Function changes; negatives and rollback verified.
- [ ] #132/#133/#125/#120 overlap dispositions recorded on original PRs.
- [ ] Issue #130 migration registry read-only comparison completed; no unapproved production changes.
- [ ] Issue #29 populated two-tenant authenticated acceptance and required security controls complete in approved environment.
- [ ] Founder-reviewed claims, consent, recipient and contact receipt tested, including mobile/keyboard/reduced-motion.
- [ ] Real customer access entered in the one Buyer Discovery Sprint, with **zero** remaining zero until evidence changes.
- [ ] Human release approval, exact preview SHA and rollback evidence before any merge that may deploy production.

**Status vocabulary:** Designed ≠ source implemented ≠ exact-head CI passed ≠ preview deployed ≠ real-data authorized ≠ expert-approved ≠ customer-validated. Report each separately.

**This register supersedes only the stale documentation-index statement that the #136 GitHub jobs had not started.** Those four workflows did pass on 208747c; Vercel failed on that same head. It does not supersede commercial deadlines, data-rights gates or the canonical company plan.
