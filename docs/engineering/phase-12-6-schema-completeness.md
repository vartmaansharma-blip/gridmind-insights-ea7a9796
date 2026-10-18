# Phase 12.6 — Schema Completeness Audit

Status: **COMPLETE**

The prior concern about `machine_type_catalog` and `machine_measurement_catalog` having no primary keys was investigated against the live PostgreSQL catalog.

They are **views**, not tables.

## Live object classification

### machine_type_catalog
View over:
- `machine_types`
- `machine_type_knowledge`

Row identity comes from `machine_types.id`.

### machine_measurement_catalog
View over:
- `machine_measurement_definitions`
- `machine_types`

Row identity comes from `machine_measurement_definitions.id`.

Therefore adding primary keys to these objects would have been architecturally incorrect.

## Actual schema hardening performed

`factory_assets.factory_id` was verified to contain **0 NULL rows across 8 assets** and was changed to `NOT NULL`.

This enforces the canonical invariant:

> Every production physical asset belongs to exactly one factory.

## Advisor result

- Security Advisor: **0 findings**
- Performance Advisor: only unused-index informational findings remain. These are expected because the database currently has very little traffic and should not be used as a reason to delete the indexes required by the canonical foreign-key and query paths.

## Decision

Phase 12.6 is complete.

The catalog views remain views.

The underlying base tables remain the authoritative schema objects.

No unnecessary replacement tables or artificial primary keys will be introduced.

The application migration can resume only after this corrected schema state is reflected in the repository migration history.
