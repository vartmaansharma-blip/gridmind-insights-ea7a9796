# GridMind infrastructure-intelligence strategy — 17 October 2026

**Status:** Founder-directed strategic direction and proposed operating sequence; **not** buyer validation, release permission, or commercial wedge selection. The [Master Plan](gridmind-master-plan-2026-10-11.md), [Decision Constitution](gridmind-decision-constitution-and-contradiction-register-2026-10-10.md), and [Buyer Discovery Sprint](gridmind-buyer-discovery-sprint-2026-10-11.md) retain their established authorities. Where this proposal conflicts with an existing gate, the gate wins until explicit evidence-based revision.

## Durable strategic definition

GridMind aims to become an **industrial and infrastructure intelligence company** that helps organizations investigate fragmented operational evidence, identify defensible risks and inefficiencies, support qualified decisions, and verify the results of customer-owned corrective actions.

**Operating loop:** authorized evidence → provenance and quality checks → domain-specific analysis → uncertainty and competing explanations → qualified human review → customer-controlled action → outcome measurement → permitted learning.

The long-term ambition includes connected operations, industrial electricity, asset reliability, and potentially wider critical infrastructure. This is a possible expansion pathway, **not** a commitment to build universal AI or autonomous control.

## C1 and C4 service theses

| Topic | C4: Electricity cost/exposure | C1: Incident evidence investigation |
| --- | --- | --- |
| Buyer decision | Whether billing, tariff classification, demand/power-factor exposure, or consumption anomalies merit action | What evidence supports an incident narrative, which hypotheses deserve investigation, and which corrective actions to test |
| Inputs | Authorized bills, supply agreements, applicable tariff version and effective period, demand/consumption history | Authorized incident records, shifts, maintenance/production logs, timestamps, equipment context |
| Output | Reproducible period/tariff checks, exceptions, uncertainty, qualified review, actionable brief | Provenance-linked timeline, observations vs hypotheses, missing evidence, expert-reviewed investigation brief |
| Cannot promise | Automatic reduction of energy use, guaranteed recoverable savings, utility approval | Definitive root cause from thin records, automatic equipment repair, safety-critical diagnosis or prevention |
| Delivery owner | Qualified electrical/tariff professional | Qualified plant/reliability professional |

**Commercial sequencing hypothesis:** Test C4 as the *first bounded paid-review candidate* because document-based investigation may be easier to start; test C1 as a parallel **lightweight manual** historical incident pilot. This is a prioritization hypothesis only. The current canonical plan still treats both as discovery probes without a chosen commercial wedge. Select, narrow, pivot or stop only after the existing Tier 1/Tier 2 evidence and approval gates. Reuse synthetic C1/C4 method fixtures without treating synthetic tests as buyer evidence.

## Integrated customer experience (proposed, not a production-ready claim)

- Public homepage is the main entry and retains GridMind's established visual identity (including signature green). Visitors can explore and request a human conversation **without mandatory account creation**.
- An authorized prospective customer may take self-service or assisted onboarding: authentication → organization identity and membership → factory record → scoped consent/permissions → minimal relevant evidence → service case → dashboard.
- Returning users route according to server-verified organization, factory and case entitlements. Incomplete onboarding resumes at its last authorized step; multiple factories require explicit selection.
- Customer workspace shows service-specific real statuses and approved published findings only. Internal operations manages intake, evidence checks, specialist assignments, independent review, approval, and versioned decision briefs. Neither client navigation nor role labels substitute for server-side enforcement.
- Preserve and adapt the **existing** Lovable dashboard and the integrated `/website`, `/cases`, `/team/*` sample routes rather than overwrite or create parallel production apps. Final root-path migration, distinction between the two currently existing dashboards, and authentication callback behavior must be checked against source before any route changes.
- Before real customer documents: prove storage custody, tenancy/RLS isolation, object permissions, reviewer independence, customer consent, document retention/deletion rules, signed publication, incident audit trails and live release gates. Synthetic/demo artifacts must stay clearly labeled.

## Shared platform, distinct specialist methods

Shared primitives: user ↔ organization memberships, factories, cases, consent/authority records, documents with provenance, immutable evidence revisions, findings with confidence and source references, reviewer decisions/dissent, versioned reports, customer-approved actions, baselines and measured outcomes. Reuse canonical tenant identifiers and existing case tables; do **not** create duplicate identity systems.

C4 needs versioned tariff rules and defensible calculations. C1 needs chronology, event definitions and competing causal hypotheses. A single generic AI analysis engine is **not** an acceptable substitute for these domain methods. Neither service should publish unreviewed technical conclusions or invented benefit figures.

## Business-model and scaling gates

1. **Discovery gate:** Speak to actual decision owners; record the current workaround, who bears the cost, access permissions, disconfirming evidence and explicit next step. Keep the existing dates and targets in the discovery tracker.
2. **Delivery gate:** Have a qualified reviewer perform a bounded case using permissioned data **after** legal/technical release controls. Record time, cost, evidence gaps, corrections, and whether the customer found the result actionable. A useful 'no material issue' finding is valid.
3. **Commercial gate:** Test paid willingness, repeat need, alternatives, margins, and customer verification of outcome. No ₹15,000 price or ROI assumption becomes a promise by inclusion here.
4. **Productization gate:** Automate only repeatable, validated analysis; demonstrate reproducibility, access isolation, auditability, reviewer sign-off and lower delivery cost.
5. **Expansion gate:** Add other infrastructure domains only where customer pull, reusable capability, rights to data and defensible economics justify investment.

## Current scope / next execution

**Now:** Complete controlled synthetic case-to-brief acceptance; retain the existing application; test the customer onboarding route and permission model in isolation; seek qualified reviewer critique; run real C1/C4 buyer discovery under the Master Plan.

**Later, conditional:** Real document custody, live customer workflows, paid reports, recurring monthly checks, sensor/OT integrations, broader equipment or infrastructure intelligence.

**Explicitly not established as of this decision:** customer interviews, permission to use real data, signed reviewers, paid demand, attributable savings, live tenant security, recurring revenue, or a competitive moat. Building a polished interface does not establish any of these.

## Evidence needed to reconsider the plan

The next decision should compare C1 and C4 on access rate, record completeness, reviewer availability, actionable value, buyer willingness to pay, delivery gross margin, repeat need, and comparative competitive advantage. Treat a C4-first preference as reversible when these observations contradict it.
