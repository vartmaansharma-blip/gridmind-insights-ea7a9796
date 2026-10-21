# Synthetic invoice-exception experiment

**Status:** supporting product/method specification, 20 October 2026; Refs [#159](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/159). [Master Plan](../gridmind-master-plan-2026-10-11.md) remains the execution authority. No commercial validation.

## Purchased hypothesis and scope

Provisional buyer: owner/CFO or commercial/accounts head of a component manufacturer with a recurring unresolved delivery/acceptance/invoice discrepancy. Test whether a source-linked, human-reviewed packet improves a specific acceptance decision beyond Excel, the current ERP and competent manual investigation. An accepted invoice awaiting cash alone is ineligible. Quality/grinding/rework on one part is the alternative if it has a better eligible case and reviewer.

The implementation is a narrow **offline synthetic R2 method**, reusing existing Resolve lifecycle evaluation. It does not add an R2 connected engine, change C1/C4 enums, retire compressed air/electricity, or create an ERP/accounts ledger. No customer data, network, database, migrations, server permissions, equipment action, collection, lending, legal opinion or live export publication.

## Functional interface

- Internal existing `/investigations` route: bundled invented quantity-difference, no-gap and conflicting-invoice examples; inspect source lines/unknowns; distinct simulated reviewer accept/revise/reject; separately authorised fictional customer action; inconclusive follow-up; source-preserving JSON download.
- Domain: `src/lib/gridmind/invoice-exception.ts`.
- CLI: `scripts/invoice-exception.ts`; commands inspect → review → action → outcome → reopen. Every write uses exclusive creation; an existing output cannot be overwritten.
- Inputs: exact simple CSV header in `data/synthetic-invoice-exception/quantity-difference.csv`; declared synthetic organization/factory/case and one order/invoice/part/drawing revision, whole pieces and INR paise. Original bytes, SHA-256 and physical source lines retained.
- This is an explicit normalized observation CSV, **not** an automatic parser for original PDFs, portals or arbitrary Excel exports. Any future mapping to original source documents requires reviewed lineage. Declaring origin synthetic does not establish real data rights.
- Maximum 500 rows / 2 MB UTF-8 CSV; CLI JSON/report inputs capped at 4 MB. Quotes/multiline cells and unsupported units/currency fail explicitly.
- Multiple records for a document kind are ambiguous, including legitimate partial receipts: no silent sum, deduplication, canonical selection or amendment. Such cases need a separately designed method.
- Negative states: missing/unknown records, zero vs missing values, duplicate IDs/versions, reversed chronology, mismatched scopes, altered raw/normalized evidence, stale review, independent reviewer/actor checks, missing customer authorization or completion references.
- Reviewer history is retained. Review cannot erase recorded action history. Source changes require a new import/report and new simulated review. Prior files remain intact; no authenticated attestation, durable server history or trustworthy tenant identity is claimed.
- The only supported outcome classification is **inconclusive**. A completion claim references fictional source lines and is never professional outcome verification. A source hash establishes byte integrity, not authenticity. Institution-level learning remains an unconfirmed proposed rule.

## Run the invented round trip

Use Bun 1.3.5 from repository root; output paths must be new.

```sh
bun scripts/invoice-exception.ts inspect data/synthetic-invoice-exception/quantity-difference.csv data/synthetic-invoice-exception/scope.json /tmp/gm-invoice-inspected.json
bun scripts/invoice-exception.ts review /tmp/gm-invoice-inspected.json data/synthetic-invoice-exception/review.json /tmp/gm-invoice-reviewed.json
bun scripts/invoice-exception.ts action /tmp/gm-invoice-reviewed.json data/synthetic-invoice-exception/action.json /tmp/gm-invoice-action.json
bun scripts/invoice-exception.ts outcome /tmp/gm-invoice-action.json data/synthetic-invoice-exception/outcome.json /tmp/gm-invoice-outcome.json
bun scripts/invoice-exception.ts reopen /tmp/gm-invoice-outcome.json data/synthetic-invoice-exception/scope.json
```

## First commercial proof-of-value protocol

**This is a proposed permissioned future test, not a launched service.** The founder's reported 15-day cash interruption does not yet qualify it.

1. One factory, one buyer, one recent documented acceptance/invoice disagreement. Confirm a specific missing document, quantity/revision mismatch or disputed acceptance is blocking a decision. Identify economic buyer and appropriate independent commercial/quality reviewer.
2. Before non-public inputs, agree rights, scope, safe custody, retention, recipients, current-method baseline, budget path and reviewer. The offline demo is not an approved customer storage system; #29/#130 and applicable security/release gates still apply to any connected use.
3. Collect only permissioned PO/revision, dispatch/receipt, acceptance/rejection, invoice and stated dispute reason. Preserve unknowns. Compare against a timed independent Excel/ERP/manual-expert review using the same frozen sources; disclose order/learning effects if independence is infeasible.
4. Complete a reviewed packet within five working days of complete inputs. All material references/amounts reconcile or are explicitly unresolved. Require at least 30% lower preparation effort plus a decision/action unavailable from the baseline; a nicer summary alone fails.
5. The customer, not GridMind autonomously, submits any communication. Within ten working days of submission require a buyer acknowledgement that the missing item is resolved or an actual documented acceptance/dispute decision. Silence or a missing buyer response is unproven, not success.
6. Fail/narrow if the obligation was already accepted, the obstacle is cash/leverage/ordinary terms, current alternatives suffice, no authorised decision owner exists, or a safe/competent method is unavailable. Access failure and negative demand are distinct.
7. Cash receipt is not automatically attributed to the packet. Principal released is not benefit. Estimate financing benefit only with a credible counterfactual payment date and applicable funding rate; otherwise report unknown. No loss/profit/savings inferred from invoice face value.
8. Price only after actual scope/cost estimation. Proposed commercial gates: conservative incremental buyer benefit ≥3× fee, direct contribution ≥30% after acquisition allocation, founder replacement-cost labour, reviewer, travel, corrections/tools and collection; actual buyer commitment required. These are policies to test, not validated economics.

**Alternative proof:** one part/revision, one finishing operation, ten comparable batches; separate required finishing from extra passes. ≥90% quantity reconciliation and source-linked findings, a qualified reviewer-accepted decision not supplied by the current method. Only after separate safe action approval test ≥10% lower labour-hours per accepted piece across ≥8 matched batch pairs, no worsened rejection or specification failure, zero attributable quality escapes, no >5 percentage-point on-time-delivery deterioration. Small-sample comparisons do not establish causality; fixed wages freed are not automatically cash savings.

## Acceptance and release

Unit/CLI tests cover original-source preservation, unknowns, scope/integrity checks, review/action/outcome boundaries and non-overwriting save/reopen. Browser tests cover positive and negative/mobile paths without backend requests; existing product/synthetic regressions remain required. Offline cross-scope tests are **not** live tenant-isolation acceptance.

Keep the PR draft pending actual exact-head CI/browser/preview/review evidence. Main is deployment-connected. No merge, production release, customer data, qualified signoff, paid demand or savings follows from this experiment.
