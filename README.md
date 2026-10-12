# GridMind Insights

> **Being built to turn industrial evidence into better decisions and verified improvement.**

GridMind is being developed as an industrial intelligence and performance-improvement company. The long-term ambition is to help manufacturers investigate operational problems, make evidence-backed decisions, coordinate approved improvements, and verify outcomes. This is an ambition, not a claim that all capabilities exist today.

## Current truth

- **Commercial wedge:** undecided.
- **Discovery probes:** C1 — downtime/production-loss investigation; C4 — energy/material inefficiency. These are probes, not product commitments.
- **Access:** the founder reports an initial public-route inquiry to ASIA was sent on 2026-10-12. No reply, buyer conversation, customer-data permission, factory access, paid demand, or verified savings is confirmed.
- **Next access test:** a small 3–5 genuine warm-introduction-request effort by 2026-10-19, only if legitimate contacts and actual capacity are available.
- **Product/release status:** consult the current technical evidence and release gates; a successful build or synthetic test is not proof of production readiness or customer demand.

## Start here

1. [Documentation index](docs/README.md) — repository map and reading order.
2. [Contribution standards](CONTRIBUTING.md) — source-of-truth rules, issue-to-PR workflow, validation, and safety requirements.
3. [Pull request template](.github/PULL_REQUEST_TEMPLATE.md) and [issue templates](.github/ISSUE_TEMPLATE/) — consistent scope, acceptance evidence, risk, and review records.
4. [Canonical Master Plan](docs/gridmind-master-plan-2026-10-11.md) — the only company execution plan.
5. [Live Buyer Discovery Sprint](docs/gridmind-buyer-discovery-sprint-2026-10-11.md) — the only live customer-access and discovery tracker.
6. [Decision Constitution](docs/gridmind-decision-constitution-and-contradiction-register-2026-10-10.md) — binding strategic, safety, evidence, and scope guardrails.
7. [Verification Audit](docs/gridmind-verification-audit-2026-10-12.md) — point-in-time verification; recheck live systems before acting on operational findings.

## Product and operating model

GridMind's proposed operating loop is:

**Authorized evidence → traceable findings → qualified human review → customer-approved action → measured outcome → retained learning only where rights permit.**

The initial commercial offer must be selected from real buyer evidence. Do not claim autonomous diagnosis, verified root cause, guaranteed savings, accuracy, ROI, customer endorsement, or production readiness without the corresponding evidence and approval.

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

The project uses Bun. Install the pinned package manager version from `package.json`, then run:

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

Run the relevant checks before proposing a merge. Record the exact commit and results; do not claim a check passed unless it was actually run. Review [Release Gate](docs/release-gate.md) and the relevant technical runbooks before any live or customer-data workflow.

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
