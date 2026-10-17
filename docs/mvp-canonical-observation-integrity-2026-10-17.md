# GridMind MVP — Canonical observation integrity guard

**2026-10-17 · Additive schema hardening.**

## Why this matters
Before this change `public.observations` granted authenticated factory users INSERT and UPDATE; an unreviewed browser input could claim `quality_status='valid'`, or associate a reading with a data source or machine in another factory. That bypasses the intent of GridMind's evidence-led, human-reviewed analysis method.

## Protection introduced
- Ordinary authenticated factory manual observations can still be added, including **zero values**, with `quality_status='unverified'` or other non-validated states; existing `recordFactoryObservation` already submits only `unverified`, `estimated`, or `missing`.
- Direct authenticated browser inserts claiming `quality_status='valid'` now fail; only a separately controlled, reviewed server-side process may mark a new measurement as technically valid.
- For all new observations, reject a source from a different factory; reject machine/asset identity from a different factory; reject an inconsistent factory subject ID; reject any estimated row claiming `valid`.
- New observations are append-only at the DB trigger; authenticated API roles cannot UPDATE or DELETE originals. Any future corrections must append a new version with clear supersession provenance and authorized review.
- Existing records are left untouched. This is a security control, not a completed source-verification service or a model-specific diagnosis.

## Test / deployment boundaries
`supabase/tests/canonical-observation-ingress-contract.sql` runs in isolated Migration Replay after seeded disposable factories/users. It verifies a permissible unverified zero-value entry, forged 'valid' denial, mismatched source and asset denial, inconsistent factory subject denial, and immutable original data.

Before applying to live Supabase, reconcile the missing production case migrations in [Issue #130](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/130), review user roles and existing data, and use a version-consistent forward-only migration release. Do not manually apply this from the web SQL editor.

## Still open
- Independently authorized **human reviewer validation** RPC with immutable correction/provenance and role separation.
- Defensible intake and original file custody where client has permission to share plant records.
- Linking a reviewed canonical measurement + server-persisted analysis to one case/decision brief.
- Real field pilot and follow-up measurement before any verified customer savings claim.
