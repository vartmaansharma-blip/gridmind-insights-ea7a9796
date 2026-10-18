# GridMind R3 — Industrial Electricity Bill Screening: Method Contract & Synthetic Acceptance
**Date:** 18 October 2026 · **Status:** PROPOSED RESEARCH METHOD, **NOT AN AUDIT, PRODUCT FEATURE, VERIFIED TARIFF ENGINE OR REAL CUSTOMER SERVICE**.
**Companions:** [Industrial intelligence lessons](../research/gridmind-industrial-intelligence-competitor-learnings-2026-10-18.md), [GridMind Resolve domain contract](gridmind-resolve-domain-and-product-contract-2026-10-17.md), [sole discovery tracker](../gridmind-buyer-discovery-sprint-2026-10-11.md), [Service SOP](../operations/gridmind-3-1-service-sop-commercial-and-payment-blueprint-2026-10-17.md).
**Regulatory source of record:** [JSERC Tariff Orders](https://jserc.org/tariff.aspx). It lists separate 2026–27 orders for JBVNL (25 Mar 2026), Tata Steel Limited (23 Mar 2026), Tata Steel UISL (23 Mar 2026) and other entities; verify each relevant supplement/effective date and that the *retail* supplier/contract actually applies to the consumer before analysis.

## 1. Customer value hypothesis and strict screen boundary

**Goal:** In a *limited, permissioned and appropriately reviewed* screen, find whether a manufacturer's electricity **bill/contract** contains an unanswered question worth paid technical investigation. A preliminary screen does **not** diagnose physical electrical faults, promise a refund, authorize contract changes, certify tariffs, test machinery or provide a full energy audit.

**Three questions ONLY at initial screen:** 
1. **Contract-demand/billed-demand items** — were the applicable contracted demand, demand measurement and billed demand charged consistently with the specifically identified terms?
2. **Power-factor-related bill items** — is a charge, rebate or calculation that exists under the *actual* relevant tariff explainable? A separate “PF penalty” is **not presumed** for every tariff.
3. **Tariff category** — does the recorded classification require qualified eligibility/contract verification? A category mismatch is not a proven refund without rule-specific evidence.

**Independent R2 comparator:** R2 invoice-acceptance disputes must be researched with real commercial decision-makers; this document does not select R3 as first paid product.

## 2. Intake fields (schema proposal only; not a production table)

| Required field | Acceptance / uncertainty rule |
|---|---|
| `screen_id`, `fictional`, `source_type` | Synthetic ID when testing. No actual manufacturer names, consumer IDs, bank data or addresses in public fixtures. |
| `consent`, `authorized_reviewer`, `source_custody` | Real records **not admitted** until customer rights and secure handling are approved. |
| `supplier_entity`, `distribution_licensee`, `service_territory` | Do not infer JBVNL from a Jharkhand address; distinguish TSL, TSUISL, DVC and others. |
| `bill_start_date`, `bill_end_date`, `billing_days` | Check validity against current/historical effective rules; cross-period bills may need splitting. |
| `source_tariff_order_id`, `source_url`, `order_effective_from`, `order_revision` | Exact applicable source or **INCONCLUSIVE**; recheck corrigenda, amendments, category changes. |
| `consumer_tariff_category`, `supply_voltage`, `contract_demand_value`, `contract_demand_unit` | Eligibility cannot be inferred from bill total; validate unit and contract period. |
| `billed_demand_value`, `demand_unit`, `demand_charge_line`, `amount_currency` | Separate observed bill line from hypothetical allowed computation and amount. |
| `power_factor_observation`, `power_factor_charge_or_rebate`, `pf_rule_applicable` | Missing/ambiguous means *unknown*, not a penalty or opportunity. |
| `total_bill`, `prior_bill_context`, `production_context` | Optional comparison context only; higher bill is not proof of supplier error. |
| `reviewer_name_or_ref`, `review_competence`, `method_version`, `review_state` | Synthetic reviewer must be labeled fictional; real signed approval requires actual professional. |

Do not store sensitive real data, consent letters, IDs, PDFs or secrets in the public repo. Real intake may not be constructed from this design before #29/#130 and data-rights gates.

## 3. Processing contract (fail closed)

1. **Determine actual supplier and regulated/contractual source first.** No universal state tariff table; retail billing may differ by area and category.
2. **Verify temporal validity:** bill period, tariff effective date, contract changes and amendment/corrigendum history; unresolved mismatch means INCONCLUSIVE.
3. **Check units:** kW vs kVA, demand measurements, billed period and ₹ calculations must never be interchanged without documented reviewer-specified logic.
4. **Validate bill lines without inventing a tariff formula:** deterministic arithmetic only against **professionally verified** category- and date-specific method; otherwise output QUESTION/NOT REVIEWED.
5. **Ask three narrow questions** (demand, PF if applicable, category) and link each observation to exact source reference/assumption.
6. **Do not say “error”, “saving” or “refund”** where a discrepancy is merely a screening flag; a value is *potential exposure* until verified against supplier's authorized rules and contract.
7. **Human professional review** of any customer-facing interpretation; reviewer can reject, request evidence or mark out-of-scope.
8. **Close or propose bounded paid review** through the commercial SOP. Customer authorizes all disputes, tariff changes and physical/electrical implementation through appropriate channels.

Screen outputs: **NO_OBVIOUS_ISSUE**, **MORE_EVIDENCE_REQUIRED**, **POTENTIAL_REVIEWABLE_EXPOSURE**, **OUT_OF_SCOPE**. Every result carries the limitations and version. “No obvious issue” is not proof the bill is correct. Never auto-promote screening result into a certified audit or signed professional conclusion.

## 4. Fictional synthetic acceptance matrix — tests to create, NOT passing tests today

| Fixture ID | Fictional situation | Expected screening classification | Must never claim |
|---|---|---|---|
| R3-SYN-01 | Complete consistent *fictional* supplier-specific bill, approved rule fixture | NO_OBVIOUS_ISSUE | “Audited/certified no errors.” |
| R3-SYN-02 | Supplier unclear or tariff order missing | MORE_EVIDENCE_REQUIRED | Any calculated refund |
| R3-SYN-03 | Date crosses tariff change with no period split | MORE_EVIDENCE_REQUIRED | Single assumed statewide rate |
| R3-SYN-04 | Bill indicates demand-line inconsistency under a *fictional verified rule* | POTENTIAL_REVIEWABLE_EXPOSURE | Guaranteed overcharge |
| R3-SYN-05 | PF field absent or charge rule not applicable | MORE_EVIDENCE_REQUIRED or NO_OBVIOUS_ISSUE if conclusively not applicable | Default PF penalty |
| R3-SYN-06 | Tariff category ambiguous against documented contract | MORE_EVIDENCE_REQUIRED | Automatic recategorization |
| R3-SYN-07 | Bill total rises while documented production rises | NO_OBVIOUS_ISSUE for increase alone | “Waste detected” |
| R3-SYN-08 | Fictional professional review rejects an analyst flag | NO_OBVIOUS_ISSUE or MORE_EVIDENCE_REQUIRED per reviewer decision | Rejected “opportunity” in customer-facing benefits |
| R3-SYN-09 | Customer data without source authorization | OUT_OF_SCOPE / intake rejected | Processing or storing unpermitted PDF |
| R3-SYN-10 | Synthetic bill from another tenant in an authenticated test | Access denied; no screen executed | Cross-tenant source exposure |
| R3-SYN-11 | Reviewer signs revision A, later evidence B added | Prior approval invalidated; new review required | Stale release |
| R3-SYN-12 | Apparent positive bill adjustment unsupported by utility source | POTENTIAL_REVIEWABLE_EXPOSURE pending review | “₹ recovered” or causality |

**Acceptance for a real engine** (future only): documented typed inputs; professionally reviewed tariff table with dated effective version; independently computed reference fixtures; negative and invalid source tests; mutation/stale-review checks; privacy/tenancy security review; source linked audit trail; reviewer approval and user-safe wording; business readiness. Software CANNOT be declared implemented by writing this file or a spreadsheet.

## 5. Discovery and commercial experiment

- Prospect segment hypotheses: JBVNL vs TSL/TSUISL assessed separately; approximate ₹2 lakh monthly bill screen filter is **not** a statutory or fixed commercial ICP.
- Screening is a **time-boxed research hypothesis** (~20–30 min only if actual professional method and appropriate permission allow). Do not request 6–12 months of sensitive bills before fit/rights/secure handling.
- Tentative **20 eligible screens**, **4 professionally defensible potentially material exposures**, **2 real buyer-level commercial follow-ups** and **R2 parity interviews** are illustrative management gates to precommit with an external adviser *before* collecting results. Proposed materiality is annual potential ₹75,000 or 3× quoted investigation fee, whichever greater; compare a one-time billing correction separately; *not* a proven prevalence estimate or refund.
- Price hypotheses ₹15k compact case, ₹35k deeper review, and carefully contracted hybrid where financially attributable; include free-screen acquisition costs, all founder/sales hours at shadow wage, independent reviewer cost, rework and travel; test for ≥30% direct case contribution after all attributable costs.
- Pre-existing [Nov 10 decision checkpoint and gates](../gridmind-buyer-discovery-sprint-2026-10-11.md) stay authoritative. Later festival-aware experiment windows are *proposals* requiring explicit tracker amendment; cannot silently overwrite original dates. Separate access failure from R3 demand failure.
- Actual factory-owner relative conversation is an **access route**, not yet verified completed buyer validation. Use non-confidential interview, permissioned notes, no unsupported customer-upload request.

## 6. Engineering and ownership boundary

**Now:** product researcher documents fictional scenarios; qualified tariff specialist reviews and corrects **the method**; future engineer creates isolated deterministic functions/tests *only after method approval*. Existing C1/C4 synthetic code/brand/routes preserved. No production data migration/website checkout/industrial action.

**Later (if R3 wins):** first allowed build is a local/offline, approved, *synthetic* calculation reference with unit and order-version typing, not a live production bill-reading SaaS or automated customer “savings” claim. Successful external pilot and consent/security gates must precede real customer use.

**Commercial implementation partners:** validated independent tariff professional / utility clarification route / certified electrical professional for physical work. Customer is decision-maker, implementation specialist bears responsibilities under appropriate scope, and referral compensation is transparently disclosed (default no commissions).

**Confidence status:** design ready for expert critique; no actual tariff formula, professional method endorsement, live screening data or customer payment has been verified.
