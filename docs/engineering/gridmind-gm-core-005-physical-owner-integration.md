# GM-CORE-005 integration — Physical factory and owner intent

**Scope:** India-first commercial MVP engineering foundation, **fixed public synthetic sample only**. Related: [commercial MVP #171](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/171), [owner foundation draft #169](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/169), [physical bridge merged #172](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/172). This is not a new strategy or real customer deployment authorization.

## What is integrated

- The owner-intent foundation has been reconciled without changing Git history into a new branch based on the **post-#172 main**. Five files carry source/evidence/tenancy/action-mapping modeling, deterministic conflict checks, evaluation suppression, import sanitization, and approval/execution guards with regression tests.
- The existing `physical.ts` decision path (machine → electrical connection → operation/routing → work order → customer order) passes its source-backed synthetic snapshot to the **same** `evaluate()` function. It does **not** fork or re-implement the constraint engine.
- Fixed, no-input, read-only sample scenarios add:
  - `owner_machine_conflict`: a **fictional explicitly confirmed** owner insists on an important order through Press 01 even though a verified synthetic machine-stop event makes that resource unavailable. The order/operation impact and the owner/feasibility conflict are both returned. No workaround is recommended.
  - `owner_avoid_feasible`: a **fictional explicitly confirmed** owner prefers to avoid an otherwise technically feasible action. Recommending/approving that action requires owner conflict resolution.
  - `owner_inferred`: an **unconfirmed inferred** preference is visible and requires actual owner confirmation. Inference cannot grant legal, financial, sourcing, safety or machine-control authority.
- `/investigations` displays the simulated owner objective, provenance state, linked actions and exact conflict alongside the physical topology, affected work orders, verified-vs-suspected facts, constraints and review requirements.
- Imported goal text and extracted intentions are reset to proposed; the **authenticated owner-attestation workflow is not yet built**. No real owner goal is claimed to be confirmed.

## Correctness and safety

The backend rejects foreign owner intent, nonexistent action references, stale/unverified sources and fabricated inference confirmation. An unresolved confirmed strategic conflict suppresses recommendation and blocks **any** workflow request or approval/execution from the same snapshot, not just the preferred action (no fallback-approval bypass). Commercial preference never overrides safety/quality/customer/contract prohibitions. Machine outages require independently recorded machine-stop evidence; a panel alarm cannot establish individual machine downtime or root cause.

The tests cover owner intent with and without physical disruption, confirmed/inferred objectives, alternative feasibility, incompatible sourcing, strict sample backward-compatibility, foreign ownership, stale evidence, approvals, and unrelated-line isolation. Public samples are always invented; source verification and owner attestation labels explicitly say synthetic.

No: live customer uploads, external procurement/payment, production scheduling optimization, live telemetry/PLC writes, true electrical fault diagnosis, measured real savings, validated customer demand or production release. Tenant/Auth, permissions, production Supabase drift #29/#130 and independent security + qualified domain review remain separate blockers.

## Release gate and handoff

1. Test current exact head with CI TypeScript/ESLint/Vitest/build, Quality Gate, Public Site Browser, isolated Migration Replay and Vercel.
2. Review files and security boundaries. No sensitive persistence or SQL/Auth/production changes are included; independent professional/security review is **not implied** by green checks.
3. Merge the **new, current-main-based** integration PR after required checks. Close old #169 only if its contents are verifiably superseded, with a link and exact SHA; do not double-merge or force-push prior published commits.
4. Once synthetic integration is landed, the next *commercial MVP* dependency is a narrowly permissioned manufacturing interruption/order-readiness case, an experienced operations reviewer, an authenticated owner-confirmation workflow, verified correct inputs, and competitor/Excel baseline comparison. Keep the Buyer Tracker as sole field-evidence authority.
