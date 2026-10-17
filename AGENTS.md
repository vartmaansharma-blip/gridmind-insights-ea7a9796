<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- **GridMind 3.1 (17 October 2026):** Treat an authorized industrial **exception/investigation case** as the primary resolution object. Machines, supplier records, billing documents and ERP events may be supporting evidence only where consented and relevant. A quantified *opportunity* is a separately supported economic judgment, never an automatic case output. Existing energy dashboards are preserved as synthetic/history; do not reinterpret them as customer-validated services.
- Evaluate R1 (C2 quality plus related C1 incidents), R2 (C6 acceptance/invoice disputes) and R3 (C4 electricity exposure) in discovery. Do not select a commercial wedge, build a multi-division ERP/QMS/fintech suite, or activate an R1/R2 connected engine by changing a C1/C4 enum. The revised Master Plan controls.
- Keep all industrial conclusions evidence-typed and fail closed to unknown when source resolution is insufficient, because monthly data cannot support physical fault diagnosis.

## Repository authority and execution rules

Before any non-trivial GridMind task, read [CONTRIBUTING.md](CONTRIBUTING.md) and follow its work-intake, validation, and safety rules.

Use this authority order:
1. [Master Plan](docs/gridmind-master-plan-2026-10-11.md) — sole execution plan.
2. [Buyer Discovery Sprint](docs/gridmind-buyer-discovery-sprint-2026-10-11.md) — sole live customer-access/discovery tracker.
3. [Decision Constitution](docs/gridmind-decision-constitution-and-contradiction-register-2026-10-10.md) — durable decisions and binding guardrails.
4. [Documentation index](docs/README.md) — supporting technical and reference material.
5. GitHub Issues — actionable work and acceptance criteria.

Supporting research, dated audits, prototypes, and `roadmap.md` do not override these authorities or create competing task queues. When sources conflict, stop and reconcile the canonical record before implementation.

## GridMind 3.1 implementation references

Before creating modules, review the [Resolve Domain & Product Contract](docs/gridmind-resolve-domain-and-product-contract-2026-10-17.md) and [Engineering Acceptance Ledger](docs/gridmind-execution-and-repository-acceptance-2026-10-17.md). For pricing, cash and operational risks use the [Company Economics & Risk Register](docs/gridmind-company-economics-and-risk-register-2026-10-17.md). All remain **supporting** the Master Plan; do not turn them into competing strategies.

**Mandatory separation:** a synthetic R1/R2/R3 commercial screening stage is not an implemented quality/finance diagnosis. Existing C1/C4 synthetic engine is not automatically a professional R3 tariff audit. No production data or physical-control integration before appropriate gates.

## Change and validation discipline

- Prefer a narrow issue-linked change with explicit acceptance criteria over broad speculative refactors.
- Do not select a commercial wedge, expand product scope, or make customer/savings/accuracy/root-cause claims without the required evidence.
- Keep observed facts, hypotheses, recommendations, and verified outcomes distinct; unknowns remain unknown.
- Do not use customer/factory data or perform production database/settings changes without explicit authorization, appropriate oversight, data-rights review, a tested workflow, and the required technical gates.
- Preserve authentication, row-level security, and tenant isolation. Never weaken checks to obtain a green result.
- Run relevant checks and report the exact commit/results. If Actions fails before runner steps, record it as an infrastructure blocker; do not claim application tests passed.
- Never force-push, rebase, amend, or squash commits already published to the Lovable-connected history. Preserve that history with new commits.

## Lovable and Codex collaboration

- Lovable owns product design, layout, styling, and visual interactions. Codex owns backend behavior, database/data contracts, validation, tests, security, and repository operations.
- Preserve TanStack Start, React, Vite, Bun, the existing Lovable configuration wrapper, `.lovable/project.json`, and generated Supabase integrations. Do not introduce Next.js, an alternative app framework, opaque code generation, or tooling Lovable cannot edit. Defer incompatible additions until the owner explicitly chooses them.
- Do not hand-edit generated integrations or the route tree. Fix their source configuration or coordinate the generator change through Lovable. A narrowly documented style exception for generated source must not disable its semantic/security checks.
- A necessary data-contract fix may require a minimal UI adapter; keep visual design unchanged and document the handoff. Review the corresponding types, queries, and tests together.
- Before modifying shared files, refresh the GitHub head and compare the current diff. Preserve published commits; integrate concurrent work with merge commits, never force pushes or history rewriting.
- A repository improvement must fix an evidenced defect, protect correctness/security, enable a named evidence-gathering step, or serve a validated customer need. Completing repository maintenance does not validate a commercial wedge or authorize product expansion.
