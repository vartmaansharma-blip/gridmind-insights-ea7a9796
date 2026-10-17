# GridMind Insights

> **GridMind — Industrial Profit & Resolution Intelligence.** A founder-led, evidence-first effort to help factories investigate costly operational exceptions and coordinate verified decisions, not an established enterprise product.

## Current truth — 17 October 2026

- **Strategic direction:** one industrial resolution company, one common permissioned evidence → qualified review → approved action → outcome system. We are **not** building six separate businesses or a replacement ERP/QMS.
- **Commercial wedge:** **undecided**. Compare **R1** manufacturing quality/rejected orders with related C1 production incidents, **R2** documented acceptance/invoice disputes (C6), and **R3** electricity billing/contract exposure (C4). R1 is a preferred **synthetic design demonstration**, not validated demand.
- **Evidence:** the founder reports an initial ASIA inquiry on 2026-10-12. No confirmed buyer interviews, customer records, qualified reviewer agreement, paid demand, revenue or verified results.
- **Execution dates:** appropriate introduction access test by 2026-10-19; aim for 3 conversations/one buyer next step by 2026-10-31; GO TO BOUNDED TEST / NARROW / PIVOT / STOP decision 2026-11-10.
- **Source reality:** existing application demos and connected internal source are synthetic **C1/C4**. Any R1/R2 intake work here is non-customer, experimental and distinct from a released investigation engine. Production/customer data gates remain.
- **Scope exclusions:** no autonomous root-cause diagnosis, guaranteed loss reduction, invoice collection, financial custody, plant controls, standalone cybersecurity offering or premature enterprise integrations.

## Start here

1. [Documentation index](docs/README.md) — repository map and reading order.
2. [Contribution standards](CONTRIBUTING.md) — source-of-truth rules, issue-to-PR workflow, validation, and safety requirements.
3. [Pull request template](.github/PULL_REQUEST_TEMPLATE.md) and [issue templates](.github/ISSUE_TEMPLATE/) — consistent scope, acceptance evidence, risk, and review records.
4. [Canonical Master Plan](docs/gridmind-master-plan-2026-10-11.md) — the only company execution plan.
5. [Live Buyer Discovery Sprint](docs/gridmind-buyer-discovery-sprint-2026-10-11.md) — the only live customer-access and discovery tracker.
6. [Decision Constitution](docs/gridmind-decision-constitution-and-contradiction-register-2026-10-10.md) — binding strategic, safety, evidence, and scope guardrails.
7. [Verification Audit](docs/gridmind-verification-audit-2026-10-12.md) — point-in-time verification; recheck live systems before acting on operational findings.

## GridMind 3.1 detailed operating documents

The [Master Plan](docs/gridmind-master-plan-2026-10-11.md) is the **sole company strategy and execution authority**; the additional documents below are supporting specifications, not alternate roadmaps.

- [Resolve Domain & Product Contract](docs/gridmind-resolve-domain-and-product-contract-2026-10-17.md) — actual versus proposed method, evidence permissions, case states, reviewer boundaries, system and UI tests.
- [Company Economics & Risk Register](docs/gridmind-company-economics-and-risk-register-2026-10-17.md) — cash, margin definitions, illustrative financial sensitivity, commercial and industry risk playbooks.
- [Engineering Acceptance & Repo Conversion](docs/gridmind-execution-and-repository-acceptance-2026-10-17.md) — exact source areas, issue-linked epics, test and deployment gates.
- The internal demo in `/investigations` includes a **read-only fictional Resolve lifecycle indicator** in addition to historical C1/C4 synthetic analysis. No live quality/finance engine is implied.

## Product and operating model

GridMind's proposed operating loop is:

**Exception → authorized evidence → traceable findings and competing explanations → qualified human review → customer-approved action → measured outcome → retained learning only where rights permit.**

The initial commercial offer must be selected from real buyer evidence across R1/R2/R3. Do not equate a synthetic quality or receivables triage example with a functioning connected case method. Do not claim autonomous diagnosis, verified root cause, guaranteed savings, accuracy, ROI, customer endorsement, or production readiness without the corresponding evidence and approval.

Read the [Product Definition](docs/gridmind-product-definition.md), [Accuracy and Validation Standard](docs/gridmind-accuracy-and-validation-standard.md), and [Factory Economic Model](docs/factory-economic-model-v1.md) for supporting detail. They do not override the Master Plan.

## Repository layout

- `src/` — application code.
- `tests/` — automated application tests.
- `supabase/` — database migrations, configuration, and Edge Functions.
- `data/` — versioned data contracts and schemas.
- `scripts/` — validation and development utilities.
- `docs/` — canonical operating documents, technical runbooks, and reference material.
- `.github/workflows/` — CI and specialised validation workflows.

## Local development

Use **Bun 1.3.5**, as pinned in `package.json`. Keep the committed lockfile and install with frozen resolution. The app remains TanStack Start/React/Vite with Lovable's existing configuration wrapper.

For interactive development, copy the environment template and replace its placeholders with an isolated development project's URL and publishable key. Keep both server and `VITE_*` client values pointed at that same development project. Client variables are public; never put a service-role or secret key there. `.env.local` is ignored by Git. Do not point a local experiment at production or process customer data before the release/data-rights gates pass.

```bash
cp .env.example .env.local
```

Then install and run:

```bash
bun install --frozen-lockfile
bun run dev
```

Useful validation commands:

```bash
bun run docs:links
bun run typecheck
bun run lint
bun run test
bun run build
bun run check
```

`check` includes the link audit and all core application checks above. Formatting is separate (`bun run format:check`); migration/security, Deno, and Python checks have their own workflows described in the [release gate](docs/release-gate.md).

Run the relevant checks before proposing a merge. Record the exact commit and results; do not claim a check passed unless it was actually run. Review [Release Gate](docs/release-gate.md) and the relevant technical runbooks before any live or customer-data workflow.

## Integrated product preview

The existing Lovable operational dashboard remains at `/`. The same application now provides:

- `/website` — public service explanation and labeled sample brief.
- `/cases?mode=demo` — customer sample workspace.
- `/team/intake?mode=demo` and `/team/cases?mode=demo` — team sample workflow, with the existing investigation controls embedded for connected use.

Remove `mode=demo` for authenticated isolated acceptance. Connected cases default to disabled; the server-only settings in `.env.example` must point at an authorized isolated database with the source migrations. Customer grants are case-specific and do not grant factory membership. Scope acceptance creates the case/grant automatically; accepted independent review publishes atomically when the manager authorized that policy. Source corrections invalidate the current publication automatically.

This is synthetic source/preview capability, not a real customer-data launch. Evidence responses accept references/text; file custody is pending. See the [implementation and Lovable handoff](docs/gridmind-mvp-lovable-handoff.md) for tested behavior, automation and remaining release work.

## Working in Lovable and Codex

Lovable handles design and visual implementation; Codex handles backend behavior, data contracts, tests, security, and repository operations. Keep shared changes in plain, editable code and preserve the existing stack, generated integrations, and published history. See [AGENTS.md](AGENTS.md) for the handoff rules.

## Repository maintenance

- [Contribution workflow](CONTRIBUTING.md), [ownership routing](.github/CODEOWNERS), [support](SUPPORT.md), and [security reporting](SECURITY.md).
- [Change history](CHANGELOG.md) records completed repository work; it is not a production-release claim.
- Dependabot proposes compatible Bun updates and GitHub Action updates for review. It does not automatically merge them or prove an update is safe for Lovable.
- This is a private repository with no open-source license selected. Access does not establish permission to redistribute original GridMind code; request the owner's permission. Third-party dependencies retain their own licenses.

## Engineering and safety principles

- Preserve factory and tenant isolation; do not expose one customer's data to another.
- Use customer or production data only with explicit authorization, appropriate rights, and a tested workflow.
- Separate observed facts, hypotheses, recommendations, and verified outcomes.
- Keep synthetic tests distinct from real-factory evidence.
- Avoid schema expansion, product redesign, and new modules unless justified by the current plan and evidence.
- Link implementation PRs to actionable issues and acceptance criteria. Review migrations, security effects, and validation results before merging.

## Decision authority

The Master Plan controls execution, the Buyer Discovery Sprint records live discovery events, and the Decision Constitution records binding guardrails and durable decisions. Reference documents preserve useful history and analysis but do not create competing task queues.

Do not create another master plan or discovery tracker. Update the canonical records when material evidence changes a decision.

## Internal investigation MVP

The founder-authorized synthetic workspace is available at `/investigations`, with a connected synthetic path at `/investigations-connected`. The connected API is disabled by default; its source migration must first be reviewed and applied only to an authorized isolated database. See the [implementation and Lovable handoff](docs/gridmind-mvp-lovable-handoff.md) for behavior, ownership and verification commands. Invented records only; customer-data and production release gates remain binding.
