# Contributing to GridMind

This repository is both the application codebase and the operating record for GridMind. Optimize for correctness, traceability, and safe decisions—not activity or document count.

## 1. Read the authorities before acting

1. [Master Plan](docs/gridmind-master-plan-2026-10-11.md) — sole execution plan.
2. [Buyer Discovery Sprint](docs/gridmind-buyer-discovery-sprint-2026-10-11.md) — sole live customer-access/discovery tracker.
3. [Decision Constitution](docs/gridmind-decision-constitution-and-contradiction-register-2026-10-10.md) — binding principles and durable decisions.
4. [Documentation index](docs/README.md) — map to engineering controls and reference material.
5. [Technical release gate](docs/release-gate.md) and [Issue #29](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/29) before live/customer-data workflows.

Supporting research, dated audits, prototypes, and the root `roadmap.md` do not create a second execution queue. If sources conflict, stop and reconcile the conflict in the canonical record before implementing.

## 2. Work intake

- Create or update a GitHub Issue for every non-trivial change. State the problem, expected outcome, acceptance criteria, dependencies, and validation.
- Link a pull request to its issue using `Closes #N` only when the PR truly completes that issue; otherwise use `Refs #N`.
- Keep each PR narrow enough to review and test. Split unrelated work.
- Do not create another master plan, discovery tracker, or shadow backlog.
- Record durable strategic or architecture decisions in the existing Decision Constitution, including evidence, alternatives, trade-offs, date, and affected work.

## 3. Branches and commits

- Use a short, descriptive branch name such as `fix/equipment-metadata-roundtrip`, `docs/repository-guide`, or `test/tenant-isolation`.
- Use clear commit messages with an action and scope, e.g. `docs: clarify migration review gate`.
- Never force-push, rebase, amend, or squash commits that have already been published to the Lovable-connected history. Coordinate corrections with new commits to preserve project history.
- Do not delete a branch until its PR disposition and unique commits have been checked.

## 4. Validation and evidence

Run the relevant checks and report the exact result. Useful commands:

```bash
bun install --frozen-lockfile
bun run docs:links
bun run typecheck
bun run lint
bun run test
bun run build
bun run check
```

Do not report a check as passed unless it actually ran. A successful build, synthetic fixture, local mock, or documentation change is not proof of production readiness, customer demand, root-cause accuracy, or verified savings. If CI infrastructure fails before steps start, report it as an infrastructure blocker and do not weaken the checks to obtain a green status.

## 5. Database, security, and industrial safety

- Never use real factory/customer data without explicit authorization, data-rights review, appropriate oversight, minimization, and an approved handling/retention plan.
- Never perform production schema/settings changes based solely on a PR description or local result. Require a defined change plan, recovery point, isolated validation, appropriate review, and explicit authorization.
- Preserve tenant isolation and row-level security. Never disable controls to make tests pass.
- Treat migrations, authorization, authentication, workspace boundaries, and data export as security-sensitive.
- Distinguish observed facts, hypotheses, recommendations, and verified outcomes. Keep unknowns unknown.
- Do not imply autonomous industrial authority. Recommendations require qualified human review and customer approval.

## 6. Documentation lifecycle

Classify each document as **canonical**, **supporting**, **historical**, or **redundant**.

- Canonical documents govern a specific information class; update them in place.
- Supporting documents must state their scope and must not override canonical decisions.
- Historical audits preserve what was known at a date; label their snapshot date and link to the current authority.
- Before moving or deleting a document, search inbound Markdown links, GitHub issue/PR references, workflow references, and unique evidence. Prefer a status banner and replacement link over destructive cleanup when uncertain.
- Do not add a document if the same durable information can be maintained in an existing canonical file.

## 7. Pull-request completion standard

A PR is ready only when:
- the diff matches the stated scope and linked issue;
- acceptance criteria are demonstrably met;
- tests/checks ran on the exact candidate commit, or the blocker is explicitly recorded;
- docs and links are updated where needed;
- security, data, migration, deployment, and rollback implications are stated;
- no unsupported product, customer, accuracy, ROI, or savings claims are introduced;
- required independent review is complete for security-sensitive changes.

Keep a PR in draft while any material criterion remains unresolved. Do not merge merely to reduce the open-PR count.
