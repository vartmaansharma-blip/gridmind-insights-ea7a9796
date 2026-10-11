# GridMind Immediate Execution Plan

> **REFERENCE ONLY — superseded for execution on 2026-10-11.** The sole execution authority is [GridMind Master Plan](gridmind-master-plan-2026-10-11.md); the sole live discovery tracker is [Buyer Discovery Sprint](gridmind-buyer-discovery-sprint-2026-10-11.md). This document may preserve useful analysis, but its old schedules, candidate letters, gates, engineering priorities, and numeric targets are not active instructions. Use stable candidate IDs C1–C5 and the two-tier gates in the canonical files. Do not create another plan from this document.


**Date:** 2026-10-11  
**Status:** Active execution plan. All future actions are targets until evidence records completion.  
**Authority:** The Decision Constitution remains authoritative. This plan does not authorize production mutations, collection of customer data, contracts, spending, or public claims.

## North star

Build a trusted industrial decision-intelligence company: turn authorized operational evidence into traceable findings, human-reviewed decisions, interventions, and measured outcomes. The first commercial workflow is not yet selected or validated.

## First 72 hours: parallel tracks

### Track A — Buyer evidence (highest commercial priority)
1. Identify one legitimate warm introduction route to an industrial operator or decision-maker.
2. Use the existing Discovery Execution Kit; do not invent a new outreach process.
3. Request a short research conversation about their current workflow, not a product demo.
4. Ask for one recent costly incident, current process/tools, consequence, decision owner, evidence availability, and how success is measured.
5. Record only what actually happened. Do not mark messages/interviews complete without evidence.
6. Do not request operational files at first contact. Any later data test requires explicit organizational authorization, minimization, retention/security review, and appropriate oversight.

**First milestone:** one substantive buyer conversation with a specific recent incident and documented current workaround. This is an experiment, not validation of the whole market.

### Track B — Technical release gates
1. Reconfirm the live schema read-only and check migration history for the two reported missing columns: `asset_interventions.implemented_at` and `factory_analysis_runs.input_snapshot_sha256`.
2. Reproduce the mismatch in a safe test environment.
3. Prepare a reviewed, recoverable migration plan and acceptance/rollback criteria; do not apply a production migration as part of planning.
4. Test with two distinct users and separate factories: authorized reads/writes, cross-tenant read/write denial, workspace creation, persistence after reload, and analysis-run traceability.
5. Review the authenticated SECURITY DEFINER workspace-creation RPC and leaked-password protection setting.
6. Run the full authenticated flow on an identified release candidate and record the exact commit/deployment SHA, test results, residual risks, and go/no-go.
7. Production remains NO-GO until all release gates pass and the relevant authorized reviewer approves.

### Track C — Brand-name decision
1. Keep GridMind as an internal working name only while screening candidates.
2. Create a shortlist of 5–8 more distinctive names that can cover industrial decision intelligence and broader infrastructure intelligence.
3. For each candidate, check existing businesses/products, India and relevant international trademark records, domain/social handles, pronunciation/spelling, and buyer interpretation.
4. Do not claim legal clearance without a qualified trademark review.
5. Do not mass-rename code, URLs, accounts, or product assets until a candidate passes screening and the decision is documented.

### Track D — Product scope
1. Freeze broad feature expansion.
2. Compare downtime/production loss, recurring maintenance, quality/rework, energy/material waste, and handoff delays against actual buyer evidence.
3. Select a first workflow only if there is an identifiable buyer, repeated material pain, authorized accessible evidence, a human-actionable finding, a measurable baseline/outcome, and a plausible paid path.
4. Build a synthetic-data demonstration only after buyer discovery clarifies the workflow. Label synthetic data visibly.
5. Keep marketing claims consistent with verified current capability; no savings, accuracy, customer, or readiness claims without evidence.

## Days 4–14
- Target 3–5 substantive buyer conversations as an interim checkpoint toward the 30-day target of 10.
- Compare candidate workflows with a written evidence scorecard and include disconfirming evidence.
- Complete isolated security/schema tests and a reviewed remediation decision.
- Obtain an independent technical review of security-sensitive changes.
- Decide whether any buyer-authorized retrospective test is feasible; agree scope, data permissions, baseline, review, and stop criteria before handling data.
- Complete preliminary brand screening; retain a candidate only if no obvious conflict is found, then obtain qualified review before public commitment.

## Days 15–30
- Target 10 substantive discovery conversations, not 10 superficial compliments.
- Select a wedge only if hard gates pass; otherwise narrow, pivot, or stop based on evidence.
- Execute an authorized retrospective test only if product/security readiness and permissions allow.
- Measure finding usefulness, false positives, analyst/operator time, actionability, delivery cost, and any outcome against a pre-agreed baseline.
- Decide whether to continue, narrow, pivot, or stop. A paid pilot is an option only if evidence, readiness, buyer authorization, and scope support it.

## Weekly scorecard
Track actual counts and evidence:
- Substantive buyer conversations completed / target.
- Specific recent incidents documented.
- Candidate workflows with evidence and counterevidence.
- Confirmed authorized data/test opportunities.
- Technical release gates passed / failed / not tested.
- Candidate brand conflicts checked and remaining unknowns.
- Decisions changed because of evidence.
- Next action, owner, and due date.

## Decision rules
- **Do not** confuse plans with completed work, simulations with customer evidence, a READY deployment with authenticated acceptance, or estimated savings with verified savings.
- **Do not** weaken RLS or mutate production data/settings to make a test pass.
- **Do not** upload confidential factory data without explicit authorization and a data-handling review.
- **Do not** commit to equity, investment, customer contracts, or material spending without appropriate adult and qualified legal/financial review.
- **Do** record meaningful decisions and outcomes in GitHub as they occur.

## Immediate next action
Use the existing discovery kit to identify one legitimate industrial introduction and begin buyer discovery. In parallel, reproduce the technical release blockers safely and begin a screened name shortlist. No broad product expansion until these tracks produce evidence.
