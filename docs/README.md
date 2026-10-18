# GridMind documentation — start here

**Current structure:** One canonical company handbook, one live buyer-evidence tracker and one durable decision record. Supporting specifications live in subject folders. Dated research and superseded plans are preserved separately. This guide is navigation, not another roadmap.

## Read in this order

1. [GridMind Master Plan](gridmind-master-plan-2026-10-11.md) — the single startup-to-scale handbook: what GridMind is, the factory problem, who buys, how to test it, build and deliver safely, economics, failure gates and expansion.
2. [Buyer Discovery Sprint](gridmind-buyer-discovery-sprint-2026-10-11.md) — the only live access, interview, price-signal and candidate-comparison record. R1, R2 and R3 are unvalidated; current buyer-interview count is zero.
3. [Decision Constitution](gridmind-decision-constitution-and-contradiction-register-2026-10-10.md) — durable decisions, supersession and conflict rules.
4. [Problem-Solving Constitution](gridmind-problem-solving-constitution.md) — evidence and investigation discipline.
5. [Release Gate](release-gate.md) — mandatory technical/customer-data gate; a preview build is not a production release.

## Before proposing PR #136 for main

**Do not merge solely because CI or Vercel says success.** The [GridMind 3.1 pre-merge decision packet](engineering/gridmind-3-1-pre-merge-decision-packet-2026-10-17.md) records the **current HOLD recommendation**, options to narrow release scope without rewriting Lovable history, and the separate requirements for a public informational site, synthetic case preview, and real customer data. The [Decision Constitution](gridmind-decision-constitution-and-contradiction-register-2026-10-10.md) G31-M01–M10 is the durable authority for those choices. Production Supabase case releases are NO-GO pending [#130](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/130) and [#29](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/29). Do not treat this as a second execution plan: use existing issues, PRs and the sole buyer tracker for actions and evidence.

## Manufacturing coverage, commercial delivery and solution architecture (research / specifications)

- [100 manufacturing problem hypotheses](research/gridmind-100-manufacturing-problem-opportunity-atlas-2026-10-17.md) — source-informed 10×10 inventory of possible direct, qualified expert and partner roles. These are **not** factory interviews, a product backlog or 100 deliverable services.
- [Service SOP, pricing hypotheses and GridMind payment acceptance](operations/gridmind-3-1-service-sop-commercial-and-payment-blueprint-2026-10-17.md) — authorized company invoicing and business bank transfers first; regulated hosted links only if merchant eligibility and demand justify them. GridMind fees must not be confused with manufacturers' own receivables. No live billing integration exists.
- [Manufacturer resolution product architecture](product/gridmind-3-1-manufacturer-resolution-system-and-architecture-2026-10-17.md) — one shared permitted case core, specialist methods later, explicit evidence/reviewer/security/route restrictions.
- The [Master Plan](gridmind-master-plan-2026-10-11.md), [Decision Constitution](gridmind-decision-constitution-and-contradiction-register-2026-10-10.md), and sole [Buyer Discovery Sprint](gridmind-buyer-discovery-sprint-2026-10-11.md) remain authoritative; none of the new research files replaces them or waives [PR #136's merge gate](engineering/gridmind-3-1-pre-merge-decision-packet-2026-10-17.md).

## 18 October 2026 — Competitor learning applied to GridMind 3.1

- [Competitor learning register](research/gridmind-industrial-intelligence-competitor-learnings-2026-10-18.md): date/source-qualified industrial AI lessons translated into CI-01–CI-12 product/operating constraints. External vendor funding and customer-case outcomes are not proof GridMind has paying customers or a universal AI system.
- [R3 tariff screening method and synthetic acceptance specification](product/gridmind-r3-electricity-screening-method-and-test-fixtures-2026-10-18.md): **proposed and expert-review pending**, separate supplier/order/date/category requirements, 12 negative fixtures. No current professional signoff, tariff calculator, live factory bill ingestion, or production deployment is asserted.
- **Research sequencing:** R3 first for a narrow bill-screen feasibility investigation, with R2 invoice-acceptance disputes a necessary challenger; R1 stays a fictional product illustration. The [Master Plan](gridmind-master-plan-2026-10-11.md), [Decision Constitution](gridmind-decision-constitution-and-contradiction-register-2026-10-10.md), and sole [Buyer Discovery Sprint](gridmind-buyer-discovery-sprint-2026-10-11.md) now spell out this refinement. **Commercial winner still unselected.**
- Scope and release unchanged: do not merge [PR #136](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/136), claim savings, input real data, or enable payment/plant controls without their independent acceptance gates.

## Next build step

The PR #136 integration now preserves main's application and website byte-for-byte. The proposed website copy remains in original source history for #138. Validate the narrowed documentation and isolated CI tooling integration on its exact head; see the [current scope amendment](engineering/gridmind-3-1-pre-merge-decision-packet-2026-10-17.md). Customer discovery, contact receipt and production security acceptance remain separate unfinished work.

## Find the supporting work

| Need | Folder | Start with |
|---|---|---|
| Service economics, qualified experts, first paid case and customer delivery | [Operations](operations/README.md) | [Economics and risk](operations/gridmind-company-economics-and-risk-register-2026-10-17.md), then [case scope schedule](operations/gridmind-first-paid-case-scope-template-2026-10-17.md) |
| R1/R2/R3 case methods, roles, customer/reviewer journeys and Lovable handoff | [Product](product/README.md) | [Resolve domain contract](product/gridmind-resolve-domain-and-product-contract-2026-10-17.md) |
| Existing code truth, security, migrations, tests, deployment and rollback | [Engineering](engineering/README.md) | [Repository acceptance](engineering/gridmind-execution-and-repository-acceptance-2026-10-17.md) and [structure benchmark](engineering/repository-structure-benchmark-2026-10-17.md) |
| Brand, website and interaction exploration | [Design](design/README.md) | Folder guide; proposals require current evidence and review |
| Market hypotheses, desk research and experiments | [Research](research/README.md) | Folder guide; none substitutes for buyer interviews |
| Earlier plans and dated audits | [Archive](archive/README.md) | Historical context only |

## How this repository is arranged

The application remains in `src/`, backend migrations/functions in `supabase/`, automated checks in `scripts/` and `.github/workflows/`, and fictional examples in `data/synthetic-investigation/`. The GridMind 3.1 handbook governs *why and what*; folder specifications explain *how*; issues define reviewable work; code and exact-run evidence determine what actually works. The public site remains at `/website` and the existing dashboard at `/` until a separately tested route change. Existing C1/C4 synthetic capabilities remain; R1/R2 have no connected professional engine.

**Placement rule for new writing:** edit the canonical handbook or live tracker when their truth changes; add an issue-linked specification only in the appropriate subject folder. Mark every new document as current, supporting, research or historical, with date, owner, evidence and superseded links. Never create another master plan, live tracker or independent backlog. Record durable decision changes in the existing Constitution.

**Compatibility:** Earlier files were moved into the subject folders. Small pointers remain at their old paths so older GitHub links continue to open; the folder copy is the content to edit. Do not update a pointer as though it were an authority. Git history retains every earlier version. No source file under this ChatGPT project's separate `sources/` mirror was changed.

**Historical release snapshot, 17 October 2026 (baseline `208747c`):** draft PR #136 is open/unmerged. CI, Quality Gate, Public Site Browser and isolated Migration Replay **passed** on baseline head; **Vercel exact-head deployment failed due to its build-rate limit**. Subsequent commits require fresh exact-head checks. See the [checkpoint register](engineering/gridmind-3-1-exact-checkpoint-and-integration-register-2026-10-17.md). Production/customer-data readiness remains unverified. See [engineering acceptance](engineering/gridmind-execution-and-repository-acceptance-2026-10-17.md), [issue #29](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/29) and [issue #130](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/130).
