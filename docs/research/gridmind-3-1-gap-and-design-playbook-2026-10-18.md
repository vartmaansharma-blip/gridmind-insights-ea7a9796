# GridMind 3.1 — Gap and Design Playbook (proposals not yet in the repository)

**Date:** 18 October 2026 · **Class:** supporting research and **proposals**, not a decision record, master plan, tracker or backlog · **Owner:** founder (review and approval pending) · **Supersedes:** nothing.
**Governing files:** [Master Plan](../gridmind-master-plan-2026-10-11.md), [Decision Constitution](../gridmind-decision-constitution-and-contradiction-register-2026-10-10.md), [sole buyer tracker](../gridmind-buyer-discovery-sprint-2026-10-11.md), [Release Gate](../release-gate.md).

**Status rule:** every "decision" below is a **recommendation**. Nothing here is adopted until the founder approves it and it is recorded in the Decision Constitution. This file waives no release gate and asserts no customer demand, savings, expert signoff or legal advice.

**Tags:** ✔ seen in a cited source during this review · ⚑ must be verified with the named professional or primary document before use · H = hypothesis to test.

**Scope note:** the gap check was a keyword search of the documentation on the PR #136 head plus a read of the closest existing documents. Where a topic is partly covered, the existing document is linked. A search miss is not proof a topic is absent.

---

## 0. Conclusions in ten lines

1. PR #136 merged on 18 Oct 2026 (main `363cbfa`) as a documentation reorganisation; application code is unchanged. It did not move the business: the [buyer tracker](../gridmind-buyer-discovery-sprint-2026-10-11.md) still records **zero** buyer interviews.
2. The binding constraint is **access and trust**, not product. Every other risk follows from not yet having a real bill, a real expert opinion and a real buyer.
3. R3 contains **two products**: *Bill Forensics* (errors, evidence, recovery) and *Contract Optimisation* (demand, tariff category, power-factor, open-access decisions). They differ in buyer, proof, competition and economics. Propose Forensics as the door-opener and Optimisation as the upsell.
4. The paid offer must differ from the free one. Free = screen ("is anything worth a look?"). Paid = **Claim File**: an expert-signed, filing-ready evidence pack.
5. A review can find problems **against the customer** (under-billing, demand drawn above contract, category misuse). An **adverse-finding protocol** and a **Letter of Authority** should exist before the first real screen. Neither is covered elsewhere in the repository.
6. At about 12 founder-hours a week, roughly two paid cases a month are possible. That is a proof of concept, not a livelihood; a retainer, higher-value offer or delegated delivery is needed to go beyond it.
7. The first software worth building is a **tariff registry plus deterministic recomputation with a billed-total reconciliation gate**. Portal, dashboards and payments wait.
8. Acquisition will run through people (accountants, electrical contractors and AMC vendors, local industry bodies), by phone and WhatsApp, often in Hindi.
9. Partly or not covered in the repository: the grievance-forum route, the customer authority letter, the adverse-finding protocol, TDS cash effect, entity set-up, retainer economics, channel playbook, WhatsApp intake and retention process.
10. Proposed sequencing: freeze new documentation, then run 5 → 10 → 20 real screens with predeclared stop rules.

---

## 1. Evidence base and limits

**Checked**
- ✔ Repository `gridmind-insights-ea7a9796` (public). PR #136 head `b32fb2d` merged into main as `363cbfa` at 11:25 IST. Net change versus the earlier main was documentation plus a Supabase CLI pin in the isolated migration-replay workflow; `src/` and `supabase/` were unchanged. The repository's link checker passed on that head.
- ✔ The documentation guide states the buyer-interview count is zero and that R1, R2 and R3 are unvalidated.
- ✔ JSERC raised retail tariffs for all categories for FY2026-27 and raised open-access charges (cross-subsidy surcharge, wheeling) ([CSIS India States](https://indianstates.csis.org/articles/2026-04-01-jharkhand-increases-retail-electricity-tariffs-for-all-categories-for-the-financial-year-fy-2026-27/jharkhand-increases-retail-electricity-tariffs-for-all-categories-for-the-financial-year-fy-2026-27/)). That page gives no percentages, demand-charge figures or billing-rule changes; the orders themselves must be read.
- ✔ Jharkhand has statutory Consumer Grievance Redressal Forums, and the High Court directed a petitioner to use one rather than a writ petition ([SCC Online, 2020](https://www.scconline.com/blog/post/2020/03/07/jhar-hc-writ-petition-not-maintainable-where-multiple-forums-for-redressal-of-the-consumers-grievance-is-constituted-for-adjudication-of-electricity-dispute/)). A JSERC guideline on forums, the Electricity Ombudsman and consumer advocacy exists (title seen only: [listing](https://simpliance.in/India/EHS/govt_notification/jharkhand/notification-of-the-jharkhand-state-electricity-regulatory-commission-guidelines-for-establishment-of-forum-for-redressal-of-grievances-of-the-consumers-electricity-ombudsman-and-consumer-advocacy-first-amendme)). ⚑ procedure, who may represent a consumer, limitation periods and fees.
- ✔ Adityapur is a large, small-and-medium-industry-heavy belt (over 1,000 units as of 2010) ([Wikipedia](https://en.wikipedia.org/wiki/Adityapur_Industrial_Area)). A Business Standard headline describes it as eastern India's largest auto cluster seeking to emerge from Tata's shadow (headline only; article not read).

**Not checked:** actual JSERC order text; any real customer bill; any expert's competence; whether any outreach has happened since the buyer tracker was last updated.

**Closest existing documents (this playbook complements, not replaces):** [qualified reviewer brief and referral plan](../operations/gridmind-qualified-reviewer-brief-and-referral-plan-2026-10-13.md), [first paid case scope template](../operations/gridmind-first-paid-case-scope-template-2026-10-17.md), [company economics and risk register](../operations/gridmind-company-economics-and-risk-register-2026-10-17.md), [service SOP, commercial and payment blueprint](../operations/gridmind-3-1-service-sop-commercial-and-payment-blueprint-2026-10-17.md), [R3 screening method and test fixtures](../product/gridmind-r3-electricity-screening-method-and-test-fixtures-2026-10-18.md), [MVP build blueprint](../product/gridmind-mvp-build-blueprint.md).

---

## 2. Goal tree (first principles)

**Three-year direction:** a trusted evidence-and-resolution layer for industrial utility and operating costs.
**Ninety-day objective:** one paid, expert-reviewed engagement delivered safely at positive contribution, with a second comparable opportunity in sight (or an honest, evidenced stop).

What must be true, in order: (1) someone with authority hands over a bill → (2) the screen finds something real at an acceptable false-positive rate → (3) a qualified expert will put their name behind it → (4) the customer pays → (5) the utility, forum or the customer's own corrective step acts → (6) the result can be shown → (7) the work can be repeated for less effort. Each design below attaches to one of these links.

---

## 3. Problem register — problem → conclusion → proposed solution

### A. Market and wedge

**A1. R3 hides two products.**
Conclusion: forensics (error recovery) and optimisation (right-sizing contract demand, power-factor correction, tariff category, open access) are different businesses. Pure billing errors may be small and rare (H); larger savings often come from optimisation, which needs engineering and competes with vendors who audit to sell equipment.
Proposal: sell Bill Forensics first (bounded, evidence-based, no equipment). Log optimisation observations as upsell leads, not first-deliverable content. After 20 screens, record which type produced the exposures.

**A2. The ₹75,000 "material" threshold may be too high for what bills reveal.**
Conclusion: ₹2 lakh a month is about ₹24 lakh a year, so ₹75,000 is roughly 3%; pure billing mistakes are often below that (H).
Proposal: record exposure in three bands (under ₹25,000; ₹25,000–75,000; over ₹75,000) so the data shows the distribution instead of a binary result that could wrongly kill R3. Set the threshold from the data and from what buyers say they would pay for.

**A3. FY2026-27 tariff increases and higher open-access charges cut both ways.**
Conclusion: higher bills may raise owner pain (tailwind); higher cross-subsidy and wheeling charges weaken the open-access upsell (headwind).
Proposal: read the FY2026-27 orders for each supplier and extract the billing rules into the registry (design D4). Treat mid-year changes, true-ups and review orders as first-class risks.

**A4. R2 may deserve a larger look.**
Conclusion: many Adityapur units are suppliers to larger buyers, so acceptance disputes, debit notes and delayed payment may be sharp pain (H). Statutory levers exist (MSME delayed-payment rules, the Micro and Small Enterprises Facilitation Council route, the income-tax treatment of late payments to micro and small suppliers) ⚑ — confirm current section numbers and rules with a CA, since the Income-tax Act, 2025 applies to transactions from 1 April 2026.
Proposal: run a small R2 "dispute triage" mirror of the R3 screen (about 5 real disputed invoices) so R2's evidence volume is not structurally lower than R3's. Respect [G31-R05](../gridmind-decision-constitution-and-contradiction-register-2026-10-10.md): customer receivables are not GridMind revenue.

**A5. Local concentration risk.**
Conclusion: if a few anchor buyers shape the cluster's economics, early samples share exposure and referral loops are tightly connected.
Proposal: tag every screen and interview by sector, size and anchor-customer dependence. After about 10 screens, test one second Jharkhand belt to separate "Adityapur-specific" from "Jharkhand-wide".

### B. Offer, pricing and value capture

**B1. The free screen and a ₹15,000 diagnostic overlap.**
Conclusion: if the free screen already checks contract demand, power factor and category, a paid review that repeats it feels like paying twice.
Proposal: make the paid product the **Claim File** (design D3): more billing periods, expert-signed findings, tariff citations, an exposure estimate with assumptions, a draft letter or application, and a filing-ready annex for a grievance forum. The free screen ends with two or three named questions; the Claim File is how they get answered formally.

**B2. Buyers pay before knowing whether anything exists.**
Proposal: a price ladder (design D2) with a credit toward later work, and a tested hybrid: lower fixed fee plus a success fee limited to documented bill credits or adjustments, the most measurable outcome in this domain. Test it; do not assume it. The existing [gain-share conditions](../operations/gridmind-3-1-service-sop-commercial-and-payment-blueprint-2026-10-17.md) still apply.

**B3. Capacity ceiling.**
Conclusion: about 12 hours a week is about 52 hours a month. At roughly 20–25 founder-hours per paid case (including sales and the screening share), that is about two cases a month. At the economics file's illustrative ₹15,000 contribution per ₹35,000 case, that is about ₹30,000 a month: a proof, not a business.
Proposal: state the first-year target as proof of delivery, then pick one lever: (i) larger plants and scope, (ii) a **monitoring retainer** (H: ₹3,000–5,000 a month per plant for monthly bill recomputation, about an hour per plant once tooling exists; 20 plants would be ₹60,000–100,000 a month), or (iii) delegated analysis by a trained junior under expert review.

**B4. Time to value is long.**
Conclusion: utility and forum processes can take months, so the customer pays before seeing any benefit.
Proposal: sell the *file*, not the outcome, and define customer-visible milestones inside GridMind's control (screen in 48 hours; Claim File in 7 working days; submission made; utility response logged). Never promise a refund or timeline.

**B5. Buyers may fear the utility.**
Conclusion: a dispute with the supplier that controls the connection, outages and approvals is a hard sell (H).
Proposal: lead with the non-adversarial path (corrections through normal channels, contract-demand reset requests, category verification) and ask directly in interviews: "Have you ever challenged a bill? What happened?"

### C. Adverse findings, authority and legal exposure

**C1. Screens can find problems against the customer.** *(Not covered elsewhere.)*
Conclusion: examples include demand drawn above contract demand, a category that benefits the customer incorrectly, under-billing or unauthorised load ⚑. Electricity-law provisions on under-billing, unauthorised use and assessment may apply ⚑ (counsel to confirm).
Proposal: an **adverse-finding protocol** agreed in writing before work: findings go only to the customer; GridMind does not contact the utility without written authority; adverse findings are labelled and handled with the customer's own CA or counsel; GridMind never conceals a finding and never self-reports on a customer's behalf. Include it in the screen consent and the engagement letter.

**C2. Limitation and arrears rules affect the lookback.**
Conclusion: the Electricity Act and regulations may limit recovery of arrears and may protect against disconnection during a dispute (for example, payment under protest) ⚑. This changes how many billing periods to review and what the customer should do while a dispute is open.
Proposal: obtain a one-page opinion from a lawyer experienced in electricity law on lookback, payment under protest, who may represent a consumer before the grievance forum, and fees and time limits. Build the answers into the Claim File.

**C3. Authority to act.** *(Not covered elsewhere.)*
Proposal: a customer **Letter of Authority** limited to document retrieval, clarification and filing on a named account and period, with expiry and revocation. Confirm that the utility and forum accept it ⚑.

**C4. Liability and indemnity.** *(Partly covered by the SOP and risk register.)*
Proposal: limit of liability equal to the fee; explicit scope exclusions; written expert independence; a professional-indemnity quote before the first paid case ⚑ (availability and price for an early-stage service unknown).

**C5. Entity, tax and invoicing.** *(Partly covered: the MVP blueprint already requires CA or lawyer review.)*
Proposal: settle the contracting entity and bank account before quoting; have a CA confirm GST status and the withholding-tax treatment of professional or technical fees under the current Act. Expect customers to deduct tax at source, so the quoted fee is not the cash received; plan cash on a net basis.

**C6. Signatory-status language.**
Conclusion: several documents describe the project as "led by a minor" and schedule work "around school". The founder should confirm which statements are accurate. If any contracting party is not an adult, every contract must run through an adult-run entity from day one; if the statements are out of date, remove them. Either way, state the signatory position once, in one place, and keep personal details out of this public repository.

**C7. Data protection.**
Proposal: treat bills as confidential business data and staff names and phone numbers as personal data (DPDP obligations ⚑ for current rules). Propose deleting raw bills 90 days after case close unless the customer asks otherwise.

### D. Delivery and experts

**D1. Reviewer sourcing and terms.** *(Partly covered: see the reviewer brief, which names JREDA as an institutional route and a BEE-directory auditor in Ranchi.)*
Proposal: add routes beyond those: retired utility engineers who ran billing, metering or consumer-complaint desks; electrical faculty at regional engineering colleges; former plant electrical heads. Use a specific ask: "review 3 anonymised bills and tell us what you would and would not sign." Terms to test: a fixed per-review fee plus a fixed share of the Claim File fee, never a share of savings found; non-solicit and referral terms; a written independence statement; no vendor commissions in the pilot.

**D2. Independence versus incentives.**
Proposal: expert pay depends on completing the review, not on the amount found. Record dissent. Track "expert rejected" rates: if the expert rejects more than half of flagged screens, the screen is the problem.

**D3. Wrong-tariff risk.** *(Partly covered by the R3 method document.)*
Proposal: a registry versioned by supplier × order × effective date × category; each screen records the registry version used; no free-form tariff arithmetic.

**D4. Accuracy is the brand.** *(Synthetic fixtures covered; real-bill golden set not.)*
Proposal: before any real screen, build a golden set of about 5 permissioned or anonymised real bills plus the existing synthetic negatives, hand-checked by the reviewer. Gate: 100% agreement on the golden set, and the reconciliation test (F2) on every real bill.

**D5. Who fixes the finding?**
Proposal: a list of implementation partners by finding type, with disclosure rules. For the pilot: advise only, no referral income.

### E. Customer acquisition

**E1. Channel not designed.** See design D8. Primary: accountants and tax consultants; electrical contractors and AMC vendors; local industry-body meetings; plant-to-plant referrals after a first documented win.

**E2. Culture and medium.**
Conclusion: owner-operators often decide by phone, WhatsApp and in person, often in Hindi (H).
Proposal: every outreach has a WhatsApp-ready three-line version; materials in Hindi and English; meet at the plant with a one-page evidence summary, not a deck.

**E3. Objections not rehearsed.**
- "Our accountant or electrician already checks." → "What did they find last time and what did it cost?"
- "We do not want to annoy the utility." → "Here is the non-adversarial path; nothing is filed without your written approval."
- "Why pay before knowing?" → the free screen comes first.
- "Is my data safe?" → trust pack and retention policy.
- "Who are you?" → name the reviewer and what they will and will not sign.

**E4. Calendar.**
Diwali (8 Nov) and Chhath (about 13–16 Nov, main days 15–16) fall inside the planned window (dates as cited in the founder's 3.1 plan). Front-load introductions now, use the festival gap for reviewer work and golden-set testing, and restart outreach after 17 Nov.

### F. Product and technology (beyond the existing gating documents)

**F1. What the product is.**
Conclusion: a **tariff engine, evidence pack and case tracker**, not a dashboard. A dashboard is a view onto cases.

**F2. Fail-closed reconciliation gate.**
Rule: recompute the bill from extracted inputs using the registry rules. If the recomputed total does not reproduce the billed total within a stated tolerance, **block flagging**: either the extraction or the tariff rule is wrong. Only reconciled bills may generate findings. This catches extraction errors, wrong tariff versions and missing line items before they become false claims.

**F3. AI role.**
Use extraction tools only to read fields, show confidence and force human verification of low-confidence fields. All arithmetic is deterministic with lineage. AI does not decide a finding.

**F4. Data-handling reality.**
Customers may send bills as WhatsApp photos. Intake SOP: receive → move to a private vault → delete from personal phone and chat → log. Never commit customer data to this public repository; add ignore rules and a pre-commit check for data and secrets.

**F5. MVP cut line.**
- **MVP-0 (no code):** spreadsheet screen, two-page report and reviewer signoff for one supplier and tariff.
- **MVP-1 (internal tool):** bill intake → fields → recompute → reconcile → flags → report; one supplier, one tariff family.
- **MVP-2:** case tracker (status, utility-response log, reminders) and a read-only customer view.
- Not now: payments, multi-tenant customer portal, sensors, ERP integrations, dashboards for their own sake.
Acceptance targets (H): 100% on the golden set; under 10 minutes per screen (from about 30); false-positive rate recorded per 20 screens.

**F6. Existing application.**
Keep the synthetic app as the demonstration shell. Propose no feature engineering on it until MVP-0 has produced a real screen, other than keeping CI green.

### G. Operations and governance

**G1. Metrics.** North star for 90 days: paid Claim Files delivered at positive contribution. Inputs: screens done, share with a flagged question, share reviewer-supported, quote conversion, hours per case, cash collected net of tax at source.

**G2. Decision hygiene.** One outside adviser (an accountant or an industrialist) who holds the kill date and sees the numbers weekly. Record approved decisions only in the existing Decision Constitution.

**G3. Founder capacity.** Cap hours as planned, protect two fixed outreach blocks a week (not building time), and review weekly whether the cap is real.

**G4. Money.** The ₹5,000 first-30-day cap in the founder's plan cannot cover entity set-up, a legal opinion, first reviewer fees and an accountant's consultation. Re-budget by line and decide what the founder can afford to lose. Do not raise outside capital before a repeat paid customer; check non-dilutive options later ⚑.

**G5. Repository governance (proposals).** A documentation freeze (no new files in `docs/` until 5 real screens exist), skipping production deploys for docs-only PRs, a shorter PR template for docs-only changes, and dated targets for issues #29 and #130 (or an explicit deferral until a customer needs customer-data storage).

---

## 4. Designs

### D1. Service blueprint (customer-visible)

| Step | What the customer sees | Proposed SLA | Evidence held |
|---|---|---|---|
| 1. Introduction | WhatsApp or phone conversation, 10 minutes | Same day | Notes, consent to screen |
| 2. Screen | One-page result: no issue / more evidence needed / question found / outside scope | 48 hours after bills received | Registry version, reconciliation result |
| 3. Offer | Claim File quote with exclusions | 24 hours | Written scope |
| 4. Authority | Letter of Authority, NDA, adverse-finding clause | Before work starts | Signed copies |
| 5. Claim File | Expert-signed pack | 7 working days | Calculations, citations, assumptions, signoff |
| 6. Filing and follow-up | Submission under the customer's authority | As agreed | Submission log, utility replies |
| 7. Close-out | Outcome: resolved / action recommended / inconclusive / referred | Within 14 days of last event | Outcome record, case economics |

### D2. Offer ladder (prices are hypotheses to test)
Free screen → Claim File (₹15,000 / ₹35,000 test points) → Resolution support (separately quoted) → Monitoring retainer (₹3,000–5,000 a month test). Hybrid test: smaller fixed fee plus a success fee limited to documented bill credits. Each rung carries written exclusions.

### D3. Claim File template
1. Scope, account and billing periods reviewed.
2. Documents reviewed (file names and hashes).
3. Supplier, tariff order, effective dates, category (registry version).
4. Reconciliation results.
5. Observations, questions and conclusions kept separate.
6. Exposure estimate with assumptions and ranges.
7. Reviewer findings, dissent and limitations.
8. Adverse-finding section (customer-only).
9. Recommended administrative steps and owners.
10. Draft letter or application; annex for a forum filing ⚑.
11. Customer decisions and authorisations.

### D4. Tariff registry and engine
Entities: `Supplier`, `TariffOrder` (id, year, source URL, effective dates), `Category`, `Component` (energy charge, demand or fixed charge, power-factor rule, time-of-day, fuel-cost adjustment, duty, rebates, delayed-payment surcharge — ⚑ confirm per order), `Rule` (formula, conditions, citation), `RegistryVersion`.
Engine: deterministic `recompute(bill_inputs, registry_version)` returning line items, total and lineage, plus `reconciled: true|false` and a diff. Findings are generated only when `reconciled = true`, and each finding stores its inputs, rule ids and citations.

### D5. Case state machine
`Introduced → Consent → Screened → Quoted → Authorised → Evidence collected → Reconciled → Expert-reviewed → Delivered → Submitted → Response logged → Closed(outcome)`. Illegal jumps are blocked (for example, Delivered without Expert-reviewed). Time in each state is recorded for the economics.

### D6. Intake and data-handling SOP
Receive on WhatsApp → save to a private vault → delete from the device → log hash and date → extract → human check of low-confidence fields → reconcile → screen → retention timer (delete raw files after the stated period).

### D7. Experiment sheets and staged stop rules
Screen record: the existing fields, extended with registry version, reconciliation pass or fail, exposure band, reviewer verdict, time spent, adverse finding yes or no, and buyer response. Interview sheet: last incident, rupee cost, who handled it, what was paid, why unresolved, budget owner, next step.
**Staged stop rules (proposed, to be fixed before data arrives):** Gate A after 5 screens (if none flag a question and no buyer shows interest, tighten the customer profile or stop early); Gate B after 10; Gate C after 20. Report access failures separately from demand failures, as the existing method requires.

### D8. Channel playbook
- **Accountants and tax consultants:** offer a free bill health check for three of their clients; they keep the relationship; no referral fee in the pilot.
- **Electrical contractors and AMC vendors:** they already see bills and power-factor issues; exchange introductions for neutral findings.
- **Industry-body or area-authority meetings:** a 10-minute talk, "five things to check on your HT bill", with no pitch.
- **Warm network:** ask for introductions; no cold spam.
- **After a first win:** a one-page anonymised case note, with permission, that can be forwarded on WhatsApp.
WhatsApp opener: "Hi [name], we're researching HT electricity-bill problems for factories in Adityapur. Could I have 10 minutes, or an introduction to your accounts head?" Hindi line: "नमस्ते, हम HT बिजली बिल की जाँच पर रिसर्च कर रहे हैं। क्या 10 मिनट मिल सकते हैं?"

### D9. Organisation and hiring triggers
Now: founder, one or two per-review experts, an outside adviser, an accountant and lawyer on call. Delegate analysis when (a) three paid Claim Files are delivered, (b) the golden-set process is stable and (c) contribution is at least 30% after founder time. First hire: a junior analyst. Experts remain independent contractors.

### D10. Weekly metrics board
Screens done · flagged share · reviewer-supported share · adverse findings · quotes · paid · cash net of tax at source · hours per case · contribution % · interviews (R3 and R2) · days since last real customer conversation.

### D11. Adjusted 30/60/90 (proposed; reviewable against the existing schedule)

| By | Must exist | Stop rule |
|---|---|---|
| 31 Oct | Entity and accountant path decided; one reviewer in conversation; 10 channel contacts; spreadsheet screen v0; golden set started; 3 interviews | No reviewer willing → narrow or change the problem |
| 14 Nov | 5 real screens (Gate A); 8–10 interviews; legal one-pager commissioned | No flags and no buyer interest across 5 → tighten profile or stop |
| 5 Dec | 10–20 screens; R2 mirror triage done; pricing tested; Claim File draft | Staged gates; outside adviser reviews |
| 15 Jan | One paid Claim File, or an honest failure report | No paid case and no credible reason → decide: pivot to R2 or stop |

---

## 5. Recommended decisions (PROPOSED — not adopted)

1. Freeze new documentation until five real screens exist; use existing documents for edits.
2. Split R3 into Forensics (first) and Optimisation (later).
3. Paid product is the Claim File; the free screen stays free.
4. Adopt the adverse-finding protocol and Letter of Authority before any real screen.
5. Commission a one-page electricity-law opinion (lookback, payment under protest, representation).
6. Settle the entity, GST and tax-at-source path with an accountant before quoting.
7. Build MVP-0 (spreadsheet) with the reconciliation gate; no new application features.
8. Use staged gates (5 / 10 / 20) instead of one all-or-nothing 20-screen test.
9. Add a monitoring-retainer option to the pricing tests.
10. Appoint an outside adviser who holds the kill date.
11. Re-budget cash by line.
12. Put retention and the WhatsApp intake SOP in the trust pack.

## 6. Open questions for the founder
1. Is a legal entity registered, and who is the signatory today?
2. Who can introduce five plant owners or their accountants this week?
3. What is the real weekly hour budget, and what can be lost in rupees?
4. Who is the first outside adviser?
5. Is there an existing contact among retired utility engineers or electrical faculty?

## Sources
- [CSIS India States: Jharkhand FY2026-27 tariffs](https://indianstates.csis.org/articles/2026-04-01-jharkhand-increases-retail-electricity-tariffs-for-all-categories-for-the-financial-year-fy-2026-27/jharkhand-increases-retail-electricity-tariffs-for-all-categories-for-the-financial-year-fy-2026-27/)
- [SCC Online: Jharkhand High Court on grievance forums](https://www.scconline.com/blog/post/2020/03/07/jhar-hc-writ-petition-not-maintainable-where-multiple-forums-for-redressal-of-the-consumers-grievance-is-constituted-for-adjudication-of-electricity-dispute/)
- [JSERC forum and ombudsman guideline (title)](https://simpliance.in/India/EHS/govt_notification/jharkhand/notification-of-the-jharkhand-state-electricity-regulatory-commission-guidelines-for-establishment-of-forum-for-redressal-of-grievances-of-the-consumers-electricity-ombudsman-and-consumer-advocacy-first-amendme)
- [Adityapur Industrial Area (Wikipedia)](https://en.wikipedia.org/wiki/Adityapur_Industrial_Area)
