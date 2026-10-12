# GridMind Repository Operating Model and Structural Audit

**Review date:** 2026-10-12  
**Scope:** Repository structure, source-of-truth rules, execution queue, pull-request hygiene, CI/release evidence.  
**Status:** Initial live audit; this document is not proof that technical or production gates pass.

## Executive finding

GridMind's main repository risk is not simply the number of documents. It is the possibility that strategy, product roadmaps, old implementation plans, open PRs, and current technical gates compete for attention. The repository needs to behave as one operating system: strategy → evidence → decision → issue → implementation → validation → outcome.

Do not perform a mass folder migration or delete historical documents before references and ownership are mapped. Improve authority and execution first; reorganize paths only where the benefit is clear and links can be verified.

## Live inventory observed on 2026-10-12

- Main commit inspected: `1c7cf1b0999254dce6e6b44c00c4a4af6511c309`.
- Git tree: 301 paths, including 80 Markdown files under `docs/`; 58 document filenames contain a date.
- Four workflow files exist: `ci.yml`, `quality.yml`, `migration-replay.yml`, and `pilot-intake-validator.yml`.
- The initial audit found 11 open PRs. Follow-up triage closed #35 and #13 as superseded/unmerged, leaving 9 open PRs from that set plus the fresh remediation PR #41. Current open PRs are #41, #38, #32, #37, #36, #31, #14, #6, #2, and #1 (10 open PRs at the latest check).
- The branch listing returned 38 branches. The API's branch objects reported `protected: false`; the connected integration could not read the branch-protection endpoint (403), so effective repository rulesets/branch protection are **not verified**.
- Root `roadmap.md` still lists broad product redesign tasks as unchecked work. This conflicts with the discovery-first Master Plan unless explicitly labelled as parked/reference work.
- No customer wedge is selected. C1 downtime/production-loss investigation and C4 energy/material inefficiency remain discovery probes, not build commitments.

## Authoritative sources

| Information | Single authority | Supporting material must not do |
|---|---|---|
| Company execution priority and stage gates | [Master Plan](gridmind-master-plan-2026-10-11.md) | Create an alternate schedule or competing backlog |
| Live customer access and discovery events | [Buyer Discovery Sprint](gridmind-buyer-discovery-sprint-2026-10-11.md) | Count planned outreach as sent or replace actual event records |
| Binding principles and durable strategic decisions | [Decision Constitution](gridmind-decision-constitution-and-contradiction-register-2026-10-10.md) | Silently override a recorded decision |
| Technical release readiness | [Issue #29](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/29) plus current runbooks and exact-commit evidence | Treat a document, build, or isolated test as production approval |
| CI execution failure | [Issue #42](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/42) | Weaken checks or guess at root cause |
| Actionable work and acceptance criteria | GitHub Issues | Use free-form roadmap checkboxes as a competing task queue |
| Implementation truth | Source code, migrations, tests, and exact commit | Let prose claim code behaviour that has not been verified |
| Deployment truth | Deployment evidence for the exact candidate commit | Infer deployment success from a successful build |

## Required target structure

Keep the existing application and data layout stable unless a specific problem justifies change. The current top-level split—`src/`, `tests/`, `supabase/`, `data/`, `scripts/`, `docs/`, and `.github/workflows/`—is a sensible base.

Within documentation, use these logical categories even before physically moving files:

1. **Strategy:** master plan, decision constitution, durable decisions.
2. **Discovery:** live tracker, interview method, evidence register, problem validation.
3. **Product:** current product definition, data contracts, bounded use-case specs, accuracy/validation standards.
4. **Engineering:** architecture, data model, security, testing, migration and release controls.
5. **Research/reference:** competitor research, industrial workflow research, long-term options, design explorations.
6. **Audit/archive:** dated snapshots and superseded plans with clear status and links to their replacement.

Do not create empty folders just to match this list. Move documents only after checking inbound links, workflow scripts, GitHub issue links, and references from other docs.

## Document disposition rules

Every document must be classified as one of:

- **Canonical:** controls a current decision or live process.
- **Supporting:** provides evidence, specifications, research, or instructions.
- **Historical:** preserves a previous state or superseded decision.
- **Redundant:** duplicates another source without adding distinct evidence.

A historical document should state that it is superseded and link to its replacement. Delete a redundant document only after checking inbound references and preserving unique evidence. Dated filenames are acceptable for immutable audits; they are poor names for living documents that change continuously.

## Initial open-PR triage — disposition is provisional

No PR should be merged merely to reduce the open count. Review each diff, checks, base, overlap, migration effects, and acceptance criteria before final disposition.

| PR | Initial action | Reason / required check |
|---|---|---|
| [#38](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/38) | Keep draft; narrow or split | Documentation reconciliation is already on main; separately review the remaining energy-analysis code and regression tests; base is stale/non-mergeable. |
| [#41](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/41) | Keep draft; exact-head validation and independent security review required | Fresh workspace-bootstrap and snapshot-integrity remediation. Its body was corrected to state that #36 remains open/unmerged. Exact-head CI/replay currently fails before steps; do not merge. |
| [#35](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/35) | Closed unmerged as superseded | Superseded by fresh PR #41. Closure is not a completion claim. |
| [#13](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/13) | Closed unmerged as superseded | Same workspace-bootstrap path now proposed in #41; closure is not a completion claim. |
| [#36](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/36) | Still open and unmerged; hold for migration review | Seven migration filename/history changes can affect replay assumptions. A comment or a dependent PR description does not mean this change is on main. Require read-only reconciliation and isolated replay; never infer production safety. |
| [#37](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/37) | Keep for focused review | Equipment metadata disappearing after reload is a concrete persistence defect; confirm regression tests and authenticated workflow. |
| [#31](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/31) | Compare with #32 | Demo opportunity/verification states may overlap with the broader opportunity workspace prototype. Preserve truthful demo-vs-persisted distinctions. |
| [#32](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/32) | Closed unmerged as deferred scope | Preserve the diff for reconsideration only after customer/problem evidence or a recorded strategic decision prioritizes this workflow. |
| [#2](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/2) | Focused review after base/check diagnosis | Truthful screening and regression gates are strategically relevant; inspect the full 16-file diff and what has since landed on main. |
| [#14](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/14) | Defer or review against pilot gate | Intake provenance and economic completeness matter for a future authorized pilot; confirm current scope and whether it is already covered elsewhere. |
| [#6](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/6) | Compare with canonical release docs | Documentation-only readiness checklist may duplicate existing release-gate/runbook material. Keep only distinct, useful content. |
| [#1](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/1) | Closed unmerged as deferred/unvalidated | Preserve the diff, but do not treat its broad diagnostic hypotheses as field-validated knowledge or use them to imply root-cause accuracy. Reconsider only after a specific workflow is selected and qualified review/validation criteria exist. |

This is a triage queue, not a completed PR audit. The next pass must compare exact patches and checks, then record a merge/revise/close decision for each PR.

## Updates after initial audit

- Root `roadmap.md` is now explicitly parked and linked from the documentation index; the Master Plan remains the only execution plan.
- PR #35 and PR #13 were closed unmerged as superseded by PR #41. Their closure does not mean the workspace-bootstrap defect is fixed.
- PR #32 (broad opportunity-workspace prototype) and PR #1 (broad diagnostic catalog) were closed unmerged as deferred scope. Their diffs remain available; neither closure claims the ideas are permanently rejected or validated.
- PR #41's description was corrected because it previously implied PR #36 had aligned migration filenames on `main`; GitHub confirms #36 remains open and unmerged.
- The documentation index now links this operating-model audit.

## CI failure finding

The three push-triggered workflows on the inspected main commit failed within roughly two seconds. Their job payloads reported `runner_id: 0` and no steps. The connector could not retrieve logs (BlobNotFound). This supports only the conclusion that normal job-step execution was not observed. It does **not** identify whether the cause is Actions policy, runner provisioning, usage limits, or another infrastructure condition.

Track diagnosis in [Issue #42](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/42). Do not change workflow YAML, remove checks, or declare code failure until the actual job-start error is visible. The integration could not verify branch-protection/ruleset settings; inspect those through a repository-admin-capable interface before relying on enforcement.

## Priority order

### P0 — Restore trustworthy execution
1. Diagnose the runner/job-start failure.
2. Confirm which checks run on pull requests and which are required.
3. Preserve the technical release gate; do not use production/customer data while critical authorization, isolation, migration, and acceptance checks remain unverified.

### P1 — Remove competing work queues
1. Keep the Master Plan and Buyer Discovery Sprint as the only living strategy/discovery documents.
2. Mark the root product overhaul roadmap as parked/reference and point it to the governing issue and Master Plan.
3. Classify the dated strategy documents and link superseded plans to the current authority.
4. Finish the exact-diff PR disposition; do not merge or close based on title alone.

### P2 — Strengthen maintainability
1. Check internal Markdown links on an executable environment.
2. Reduce duplicated workflow work only after their distinct responsibilities are documented and CI can execute.
3. Standardize issue/PR templates and require acceptance evidence.
4. Audit stale branches only after confirming their associated PR and unique commits; do not mass-delete branches.

### P3 — Resume product work only when justified
Use the customer evidence gate in the Master Plan. Do not use a successful repository cleanup as a reason to build more modules or select C1/C4 without evidence.

## Definition of repository execution readiness

The repository is not “ready” because folders are tidy. It is ready when:

- [ ] Each major information class has one authority.
- [ ] No active document contradicts the Master Plan without an explicit recorded decision.
- [ ] Every active issue has a concrete outcome, acceptance criteria, dependencies, and validation.
- [ ] Every open PR has an evidence-backed disposition and a named next action.
- [ ] CI reaches actual runner steps and required checks pass on the exact candidate commit.
- [ ] Migration replay and security/isolation checks are demonstrated in the intended isolated environment.
- [ ] Effective branch rules are verified, not assumed.
- [ ] Documentation links and local developer commands are validated.
- [ ] Technical, customer, and commercial claims remain limited to what the evidence proves.

**Current conclusion:** repository organization is improved, but full execution readiness is not established. The next critical gate is Actions diagnosis plus PR-by-PR reconciliation; broad product implementation remains subordinate to customer discovery.
