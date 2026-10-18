# GridMind — Real-Factory Pilot Data Request

**Purpose:** prepare one controlled, evidence-backed Economic Discovery analysis for one factory and one selected asset. This is a request for existing records, not a request to install sensors or change factory operations.

## 1. Pilot scope

Please nominate:
- Factory/site name and industry.
- One asset or clearly defined process to investigate.
- A factory contact responsible for energy/utility data.
- A production/operations contact who can explain shifts, products, shutdowns and unusual events.
- A technical reviewer who can validate measurements and operating context.

**Preferred first asset:** one with an identifiable energy source, a matching production measure, and an owner who can confirm how the equipment was operated. Rated nameplate power alone is not evidence of actual consumption.

## 2. Historical period and resolution

- **Minimum request:** 6 months of comparable history.
- **Preferred:** 12 months; 18–24 months is stronger where available.
- Monthly data is acceptable for initial strategic screening; daily data is better, hourly data is preferred, and 15-minute data is valuable when available.
- Include the most recent complete period and exact start/end dates.
- Explain shutdowns, major maintenance, production changes, meter replacements, shifts, or other events that make periods non-comparable.

The software's technical acceptance gate currently requires at least five complete comparable periods for its initial analysis loop. That minimum is not a substitute for the broader six-month pilot request or for expert judgment about evidence sufficiency.

## 3. Required existing records

### A. Electricity / energy
For the selected asset or the narrowest available process boundary:
- Consumption value and unit (prefer kWh).
- Period start and end, including timezone where timestamps are used.
- Meter/tag identifier and source system.
- Source record/export reference.
- Measurement quality, known gaps, resets, estimated readings, and meter changes.
- If only a factory-level bill is available, label it as factory-level; do not attribute it to an individual asset without a defensible allocation method.

### B. Production
For the same periods:
- Quantity produced and stable unit (e.g., pieces, kg, tonnes).
- Product or product mix where relevant.
- Period start/end and source reference.
- Known rejected/reworked output or other definitions that materially affect comparability.
- Explanation of periods with no production.

### C. Operating context
Where available:
- Operating hours per period.
- Shift/calendar schedule and planned shutdowns.
- Operating state (running, idle, standby, stopped) and product/process code.
- Relevant changeovers, maintenance, faults, or unusual operating events.
- Source and confidence of each record.

### D. Economic evidence
- Electricity bills or tariff schedules effective during the requested period.
- Energy rate and time-of-day components where applicable.
- Demand-charge rules and billable-demand evidence if demand analysis is requested.
- Currency, taxes/adjustments that affect the supplied cost values, and billing period.
- Documented recoverable fraction or other financial assumptions **only if the factory can support them**.
- Intervention/implementation cost only when backed by a quote, estimate with named source, or actual record.

Do not guess tariff, recoverable fraction, intervention cost, or potential savings. If a value is unavailable, leave it blank and identify the gap.

## 4. Helpful supporting records

If readily available, include equipment nameplate details, motor/drive ratings, maintenance logs, production plans, process variables, compressed-air/steam/chilled-water measurements, and post-maintenance or post-intervention records. These are helpful but must not replace the required electricity, production, period, and economic evidence.

## 5. How to fill GridMind's intake sheets

Use the blank files under `docs/templates/gridmind/`:
- `observations.csv` — one row per sourced observation and period; retain asset ID, role/metric, numeric value, unit, quality, estimated flag, source system, source record ID/reference, and notes.
- `operating-contexts.csv` — one row per operating-context interval, with state/product context and source reference.
- `economic-context.csv` — the documented economic assumption set and its effective dates.

Important:
- Keep the original exports and invoices in the factory's approved controlled storage; record stable references to them.
- Do not alter source records to make them fit the template.
- Do not combine unlike units or non-comparable periods without documenting the conversion/method.
- Use accurate quality labels such as unverified, estimated, suspect, or validated; do not label data validated until checked.
- Keep missing values missing. A blank is not a measured zero.
- Do not duplicate a source record to fill a missing period.
- CSV templates are intake sheets, not direct SQL imports and not proof that data has been accepted by GridMind.

## 6. Minimum source-quality review before submission

For each file, record:
- Who exported/provided it and when.
- Source system/meter/tag and any mapping to the selected asset.
- Units and period boundaries.
- Whether readings are measured, estimated, manually entered, or derived.
- Known gaps, corrections, resets, duplicates, and outliers.
- Whether production and energy periods actually align.
- Whether operating schedule or product mix changed.
- Who at the factory can answer questions about the source.

Flag uncertainty; do not resolve it by silently inventing a value. GridMind may return insufficient evidence rather than an opportunity.

## 7. Data protection and transfer

- Share only data the factory has authorized for this pilot.
- Use the factory's approved secure transfer/storage process.
- Do not send passwords, access tokens, personal information, or unrelated confidential records.
- Redact unrelated customer names, employee identifiers, and commercially sensitive fields when they are not needed for the analysis.
- Agree the authorized recipients, retention period, and deletion process before transferring source files.
- Do not upload factory source records into public repositories or public issue trackers.

## 8. What GridMind will return

Subject to data sufficiency, the initial review should report:
1. Data coverage, gaps, quality flags, and unresolved assumptions.
2. Whether the selected periods and measurements are comparable.
3. Findings supported by traceable evidence, or an explicit insufficient-evidence result.
4. Calculation inputs and economic assumptions for any quantified estimate.
5. Confidence/limitations and a recommended next validation step.
6. Clear separation between potential/estimated value and realized or verified savings.

A result is not a guarantee of savings. An independently reviewed finding and a suitable post-intervention measurement are required before claiming realized or verified value.

## 9. Pilot intake checklist

- [ ] Factory and selected asset/process named.
- [ ] Responsible energy and operations contacts identified.
- [ ] Six months minimum requested; available period and resolution documented.
- [ ] Electricity and production records cover matching periods.
- [ ] Units, meter/source IDs, timestamps, and period boundaries recorded.
- [ ] Operating hours/context supplied where available.
- [ ] Tariff/invoice evidence supplied or missing items explicitly listed.
- [ ] Data quality, estimates, gaps, and changes honestly flagged.
- [ ] Original source files retained in approved controlled storage.
- [ ] Factory has authorized the data transfer and use.
- [ ] No unsupported assumptions or fabricated measurements added.
- [ ] Qualified factory reviewer available to check any material finding.

## 10. Explicit non-goals

This request does not authorize production database writes, schema migrations, deployments, sensor installation, machine-control changes, or operational interventions. Those require separate authorization and readiness review.
