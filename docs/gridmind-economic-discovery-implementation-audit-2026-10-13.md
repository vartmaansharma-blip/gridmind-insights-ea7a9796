# Economic-discovery implementation audit — 2026-10-13

**Status:** Code-level gap audit; not a customer-data readiness approval. Synthetic only.

## Scope checked

Reviewed the current monthly energy pipeline in `src/lib/energy/pipeline.ts`, its existing tests, the `MonthRecord` domain type, and the energy analysis entry point. Added executable Vitest coverage for the controls the monthly pipeline currently enforces and explicit pending tests for missing controls.

## Verified in source code (not independently executed in this change)

- The pipeline flags repeated **month** values and excludes the later row.
- It flags extreme energy-intensity outliers as `SUSPECT` without deleting them from the usable set.
- Missing production values make a row unusable for the monthly analysis.
- Analysis pauses when fewer than three usable monthly rows remain.

The new test file encodes these as executable assertions. These statements describe inspected implementation and test intent; until CI runs successfully, the assertions are not reported as passing.

## Material gaps

The existing `MonthRecord` type contains monthly kWh, total cost, peak kVA, production, operating hours, and optional power factor. It does **not** carry invoice identifiers, raw/source units, site/meter boundary, utility identity, billing-period coverage, tariff-effective dates, bill line items, product mix, process/shift context, or claim-register approvals. Therefore, the existing monthly pipeline cannot fully implement the 13-case fixture.

In particular:
- T01 only partially covered: fewer than three rows pauses analysis, but missing calendar months are not explicitly detected.
- T04 only partially covered: repeated month is flagged; invoice-level composite-key deduplication is not implemented.
- T05 only partially covered: intensity outlier is flagged, but this alone does not reconcile bill components or guarantee a financial-interpretation stop.
- T09 only partially covered: missing production excludes the row.
- T02, T03, T06–T08, T10–T13 require domain fields and controls not present in the inspected monthly model.

The pending tests in `src/lib/energy/economic-discovery-readiness.test.ts` make these omissions visible rather than treating prose requirements as implemented safeguards.

## Decision

**NOT READY for customer-data use.** Do not upload real bills or factory records to this workflow. The next engineering step, if later authorized after the strategic freeze, is to design a separate source-document/intake and claim-evidence model with provenance, site/meter scope, invoice-level reconciliation, tariff line items and review gates before expanding calculation logic. No savings, root-cause, tariff-compliance, or verified-value claims are supported by this audit.

## Validation limits

This change was authored through the GitHub connector. No local repository checkout or package runtime was available in this execution, so Vitest, typecheck, lint, and build have **not** been run here. The PR's CI status must be checked before treating the new tests as verified.
