# Lovable dashboard implementation brief — GridMind

**Purpose:** complete the dashboard MVP in the existing Lovable project using the same GitHub repository and the alignment audit. This is an implementation brief, not a claim that work has already been completed.

## Source of truth and division of responsibility

- Repository: `vartmaansharma-blip/gridmind-insights-ea7a9796`.
- Existing Lovable project: https://lovable.dev/projects/12d7acd4-2c00-472a-9b77-af92553ef7dc
- Alignment audit: `docs/gridmind-system-alignment-audit.md` (PR #11 at time this brief was created).
- Lovable owns UI, frontend behavior, user flows, visual design and browser-level smoke tests.
- Backend/system work owns canonical evidence contracts, analysis logic, economic validity, database/RLS, migrations, security and authoritative persistence.
- Before editing, inspect latest GitHub commit and relevant files. Do not create a new project, duplicate analysis/schema, overwrite another agent's work, or assume Lovable editor state equals main.

## Product contract

GridMind is Factory Performance Intelligence for industrial infrastructure. The primary workflow object is an **Opportunity**; assets/machines provide supporting evidence.

The intended authoritative lifecycle is:

**Authorized factory and asset → source evidence → canonical analysis → persisted reproducible finding → human review → intervention → post-intervention measurement and verification.**

Do not imply that every stage is live when backend, membership, data, or deployment prerequisites are absent. A passing UI or synthetic demo is not a real-factory result.

### Evidence and financial vocabulary

- Evidence states: `OBSERVED`, `ESTIMATED`, `HYPOTHESIS`, `RECOMMENDED`, `VERIFIED`, `UNKNOWN`.
- Economic lifecycle: **Exposure → Potential → Expected → Realized → Verified → Sustained**.
- Clearly label all synthetic/demo records. Never present them as live telemetry, customer evidence, or verified savings.
- Unknown is preferable to an invented number. Never invent readings, tariff, currency, recovery fraction, intervention cost, operating context, calibration status, or savings.
- Never label a deviation as a proven root cause. Low-resolution monthly evidence does not prove machine failure.
- Monthly CSV screening and canonical persisted analysis are different paths unless verified code proves they are connected. Label preliminary results as preliminary.
- Financial claims should disclose source lineage, assumptions, coverage and uncertainty.

## Information architecture

Keep the existing project and preserve useful routes, schema, energy logic, machine library and eight synthetic demo assets.

1. **Overview** — executive operating screen; what may be costing money, what evidence exists, and what should happen next.
2. **Factory / Data** — data coverage, quality, sources, mappings, analysis readiness and blockers.
3. **Energy** — energy/cost performance and normalized indicators, only when supported by available data.
4. **Machines** — supporting asset evidence and machine passports.
5. **Opportunities** — primary intelligence workflow.
6. **Alerts** — important unresolved signals, with severity and evidence.
7. **Savings** — potential → intervention → post-intervention → verification.

### Overview requirements

Prioritize:
- Factory context and current data/analysis state.
- Money at risk / economic exposure, explicitly estimated or unknown where appropriate.
- Highest-priority opportunities and their supporting evidence.
- Recommended next checks/actions.
- Energy/cost performance and demand/capacity behavior, when data supports them.
- Reliability/data-quality signals.
- Savings verification state.

Do not use a generic wall of decorative KPI cards. Each number needs a defined meaning, unit, period, evidence source and status.

### Opportunity detail requirements

Each opportunity should show:
- Problem statement, explicitly calibrated to evidence strength.
- Source record(s), measurement scope, period and unit.
- Baseline/reference and why periods are comparable.
- Operating/product context.
- Economic impact only when required inputs are valid, with assumptions and uncertainty.
- Confidence/limitations and possible explanations labelled as hypotheses.
- Missing evidence and what would resolve it.
- Recommended next check/action.
- Lifecycle status and verification status.

### Savings workflow requirements

Show baseline, proposed intervention, responsible owner, intervention date/cost if evidenced, post-intervention data and verification. If no M&V evidence exists, show **Not verified / awaiting post-intervention evidence**, not a savings success.

## UI and integration behavior

- Use existing backend/API contracts and shared analysis implementation.
- The browser must not provide authoritative measurements or bypass server-side authorization.
- Do not create client-side duplicate calculations for authoritative findings.
- Implement honest loading, empty, incomplete-data, error, access-denied and unsupported-data states.
- If a backend capability is not connected or live, show a clear blocker and next step instead of fake values.
- Ensure navigation works and the selected factory/asset context remains consistent across pages.
- Keep responsive desktop and mobile layouts accessible and legible.

## Implementation sequence

1. Inspect current files, routes, latest commit, recent edits and current build/test scripts.
2. Map each existing page/route to the information architecture; identify gaps before changing files.
3. Implement the highest-impact workflow gaps in the existing project without rewriting backend contracts.
4. Add/update UI tests for evidence labels, empty/error/blocked states, opportunity details, and financial status distinctions.
5. Run typecheck, lint, tests and production build where available. Test desktop/mobile behavior if tools support it.
6. Inspect the final diff; report changed files, commit SHA, exact check outcomes and remaining blockers.
7. Keep changes reviewable. Do not merge PRs, publish/deploy, write production data, apply production migrations or change authentication settings without explicit authorization.

## Acceptance checklist

- [ ] Existing project only; no parallel project or duplicate schema/engine.
- [ ] Opportunity is the dominant workflow, not the machine inventory.
- [ ] Demo/synthetic values are unmistakably labelled.
- [ ] Missing, zero, invalid, estimated and verified values remain distinct.
- [ ] Every economic value states what stage it represents and exposes assumptions/lineage where supported.
- [ ] No fabricated or unsupported root-cause/savings claims.
- [ ] Data blockers and next steps are visible and actionable.
- [ ] Monthly screening is not confused with canonical persisted analysis.
- [ ] Navigation, loading, empty, error and access-denied states behave correctly.
- [ ] Desktop/mobile UI checked, or limitation explicitly reported.
- [ ] Relevant checks and final diff inspected; results reported precisely.
