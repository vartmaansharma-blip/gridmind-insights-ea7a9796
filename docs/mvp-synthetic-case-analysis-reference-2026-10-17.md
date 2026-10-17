# GridMind MVP — Server-analysis to investigation evidence reference

**2026-10-17 · Synthetic-only, disabled by default · No real-data ingestion or approval.**

## Purpose
A machine-level analysis already runs through the server-owned `persist-factory-analysis` Edge Function, and the synthetic case engine can support simulated independent review. Until now these were separate. This change creates a **source-linked reference from a server-persisted machine analysis run to an existing synthetic case** without calling it a qualified finding.

## Implementation
- `supabase/migrations/20261017160000_synthetic_case_analysis_reference.sql`: additive, append-only `public.synthetic_case_analysis_references` with case, server run, asset, factory, actor and original result fingerprint; no copied result JSON or fake customer approval.
- `public.link_synthetic_case_analysis(case,run)`: authenticated manager/investigator only; verify an existing **server-owned** `factory_analysis_runs` row, synthetic case, same factory, immutable fingerprint, replay-safe unique pair. No cross-factory references.
- Link writes are **disabled** unless `app.gridmind_synthetic_analysis_link_mode=isolated_fixture_only` is enabled **inside disposable CI transaction**. Never set in production.
- `public.synthetic_case_analysis_summary(case)`: minimal role-limited bibliography (run ID, asset, fingerprint, time, *unreviewed* status). No economic assumptions, private snapshots, customer publication, physical fault conclusion, or claimed validated savings.
- RLS allows manager/investigator-only SELECT and no browser mutations. Only special authenticated SQL functions can link with their own access checks.
- Migration Replay runs `supabase/tests/synthetic-case-analysis-reference-contract.sql` **after** the Edge Function generated an actual, immutable persisted analysis run from disposable synthetic fixtures. Test includes disabled-by-default denial, same-tenant link, repeat idempotency, cross-tenant link/read denial and no direct writes.

## Still blocked
This reference does not import customer evidence, verify a source, independently review an actual asset, or publish a real decision brief. The case engine remains `origin: synthetic`; its independent reviewer actions are *simulated*. A future separately approved release needs custodial permissions, append-only review decisions and client access restricted to a case before real factory evidence flows.

**Production Supabase remains out of sync** with the repository's later case migrations (Issue #130); do not apply this migration or enable case endpoints without a reviewed non-destructive reconciliation. Keep the Lovable green website at `/website`, dashboard at `/`, and parked scooter catalogue unchanged.
