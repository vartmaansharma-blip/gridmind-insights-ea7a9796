# Economic source intake model — implementation boundary

**Status:** Implemented as an isolated, deterministic domain module; not integrated into the live factory workflow and not approved for customer data.

## Added
- `src/lib/energy/intake.ts`: source provenance, site/meter and utility scope, billing-period validation, raw energy value/unit, amount validation, controlled evidence reference, optional source hash, and invoice collision review.
- `src/lib/energy/intake.test.ts`: synthetic tests for complete/incomplete intake, invalid periods and values, duplicate invoice identities, conflicting amounts, meter/period separation, and missing amounts.

## Important behavior
- The invoice match identity includes site, meter, utility, invoice ID, and billing-period start/end.
- Same identity and same amount becomes `POTENTIAL_DUPLICATE`.
- Same identity and differing known amounts becomes `CONFLICTING_INVOICE`.
- Missing amounts do not allow a confident match; they remain `POTENTIAL_DUPLICATE` for manual review.
- No record is deleted, and no version is automatically selected.
- `READY_FOR_REVIEW` means required intake metadata is present only. It does not authenticate the document, establish tariff correctness, make periods comparable, or approve financial claims.

## Explicitly out of scope
This module does not parse PDFs, upload/store documents, establish data permissions, handle retention/deletion, normalize units, calculate savings, model tariff line items, establish baselines, infer root causes, or approve customer-facing claims. It is not wired into the current UI or database.

## Validation
The module includes Vitest tests, but they must run in CI or a local repository environment before the implementation is considered verified. No real customer data was used.
