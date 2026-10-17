# GridMind documentation — start here

**Current structure:** One canonical company handbook, one live buyer-evidence tracker and one durable decision record. Supporting specifications live in subject folders. Dated research and superseded plans are preserved separately. This guide is navigation, not another roadmap.

## Read in this order

1. [GridMind Master Plan](gridmind-master-plan-2026-10-11.md) — the single startup-to-scale handbook: what GridMind is, the factory problem, who buys, how to test it, build and deliver safely, economics, failure gates and expansion.
2. [Buyer Discovery Sprint](gridmind-buyer-discovery-sprint-2026-10-11.md) — the only live access, interview, price-signal and candidate-comparison record. R1, R2 and R3 are unvalidated; current buyer-interview count is zero.
3. [Decision Constitution](gridmind-decision-constitution-and-contradiction-register-2026-10-10.md) — durable decisions, supersession and conflict rules.
4. [Problem-Solving Constitution](gridmind-problem-solving-constitution.md) — evidence and investigation discipline.
5. [Release Gate](release-gate.md) — mandatory technical/customer-data gate; a preview build is not a production release.

## Find the supporting work

| Need | Folder | Start with |
|---|---|---|
| Service economics, qualified experts, first paid case and customer delivery | [Operations](operations/README.md) | [Economics and risk](operations/gridmind-company-economics-and-risk-register-2026-10-17.md), then [case scope schedule](operations/gridmind-first-paid-case-scope-template-2026-10-17.md) |
| R1/R2/R3 case methods, roles, customer/reviewer journeys and Lovable handoff | [Product](product/README.md) | [Resolve domain contract](product/gridmind-resolve-domain-and-product-contract-2026-10-17.md) |
| Existing code truth, security, migrations, tests, deployment and rollback | [Engineering](engineering/README.md) | [Repository acceptance](engineering/gridmind-execution-and-repository-acceptance-2026-10-17.md) |
| Brand, website and interaction exploration | [Design](design/README.md) | Folder guide; proposals require current evidence and review |
| Market hypotheses, desk research and experiments | [Research](research/README.md) | Folder guide; none substitutes for buyer interviews |
| Earlier plans and dated audits | [Archive](archive/README.md) | Historical context only |

## How this repository is arranged

The application remains in `src/`, backend migrations/functions in `supabase/`, automated checks in `scripts/` and `.github/workflows/`, and fictional examples in `data/synthetic-investigation/`. The GridMind 3.1 handbook governs *why and what*; folder specifications explain *how*; issues define reviewable work; code and exact-run evidence determine what actually works. The public site remains at `/website` and the existing dashboard at `/` until a separately tested route change. Existing C1/C4 synthetic capabilities remain; R1/R2 have no connected professional engine.

**Placement rule for new writing:** edit the canonical handbook or live tracker when their truth changes; add an issue-linked specification only in the appropriate subject folder. Mark every new document as current, supporting, research or historical, with date, owner, evidence and superseded links. Never create another master plan, live tracker or independent backlog. Record durable decision changes in the existing Constitution.

**Compatibility:** Earlier files were moved into the subject folders. Small pointers remain at their old paths so older GitHub links continue to open; the folder copy is the content to edit. Do not update a pointer as though it were an authority. Git history retains every earlier version. No source file under this ChatGPT project's separate `sources/` mirror was changed.

**Current release truth, 17 October 2026:** draft PR #136 is reviewable but its exact-head CI jobs have not executed normal steps and Vercel reports a build-rate limit on the latest commit. Production/customer-data readiness remains unverified. See [engineering acceptance](engineering/gridmind-execution-and-repository-acceptance-2026-10-17.md), [issue #29](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/29) and [issue #130](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/130).
