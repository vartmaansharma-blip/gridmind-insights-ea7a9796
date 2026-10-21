# GM-MVP-002 — Connected physical infrastructure vertical slice

**Status:** synthetic engineering candidate, not production/customer release.
**Parent:** [India-first commercial MVP and paid pilot milestone #171](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/171). [GM-CORE-003](gridmind-gm-core-003-foundation.md) remains the canonical rules and authorization engine.
**Sources of truth:** Master Plan, Decision Constitution, sole Buyer Tracker, GitHub source/tests and release gate; this document adds no competing roadmap.

## What runs

The existing `/api/industrial-core` recognizes one **strictly fixed public synthetic** `{ "action": "physical_demo", "scenario": "machine_stop" }` request, with `normal`, `panel_alarm` and `suspected_fault` as the other accepted cases. These require no user-supplied records and cannot mutate the database or call machine control. The existing `/investigations` page presents the real server-computed physical topology, per-resource order/material traces and existing deterministic core decision checks.

- Physical supply nodes (fictional grid source, transformer, panel, meter) point to two machine nodes. Two machine-to-line memberships distinguish electricity **feeds** from production **line membership**.
- Each machine is bound to an actual existing `resource` entity in the core; core operations, routings and work orders identify affected customer orders. Material IDs are derived from matching product BOMs.
- Verified *machine-stop* evidence inserts one time-bounded, source-linked synthetic downtime record into a **cloned** core snapshot and passes it through the unchanged `evaluate` decision engine. No duplicate constraint evaluator was built.
- A transformer/panel interruption exposes downstream machines and order dependencies, but **does not assert downtime or an electrical root cause at those machines**. Any recommended action is withheld pending the machine's verified state.
- A speculative event, stale evidence or unverified connection never certifies machine unavailability. All outputs are `origin: synthetic`, with `inferredCause: null`, `verifiedSavings: null`, `authorizedMachineControl: false`, `customerValidated: false`.

## Safety and correctness properties

1. Organization/factory-scoped snapshots; same-tenant physical bindings to core machine/line resource IDs.
2. Reject duplicate node/link IDs, missing evidence IDs, invalid directed power connections, inappropriate line memberships, future events and cycles.
3. Require current source evidence and verified physical node state before propagating *confirmed* machine unavailability.
4. Trace **only exact operation → routing → work-order → order paths**. Shared part numbers or common upstream power sources never automatically prove two unrelated work orders stopped.
5. The UI distinguishes confirmed synthetic machine stop from potential electrical exposure; provenance is visible. No actual factory data, unreviewed engineering conclusion, real supplier approval or hidden optimum claimed.
6. Industrial security, import permissions and pilot release gates #29/#130/#150 remain blocked; no production configuration/database migration/PLC write or unauthorized cross-tenant sharing.
7. PR #169 owner-intent module remains a separate draft until independently reviewed. This branch is based on main and does not duplicate it; later engineering integration must retain both safety conditions.

## Test/acceptance contract

`src/lib/industrial-core/physical.test.ts` exercises normal, confirmed machine stop, downstream exposure, suspected fault, stale evidence, wrong tenant/resource, fake evidence, wrong edge direction, cycles and forbidden causal promotion. Existing `customer-demo` and industrial-core tests must remain unchanged and green. Before merging, verify TypeScript, ESLint, Vitest, production build, Quality Gate, Public Site Browser, Migration Replay, Vercel, branch up-to-date status and any applicable review.

**Explicit limitations:** No automatic line scheduling or production optimization, PLC/SCADA ingestion, topology discovery, live capacity inference, power protection-engineering diagnosis, authenticated customer-data ingestion or commercial proof. A competent manufacturing/electrical reviewer and real permissioned plant inputs are required before trusting this method for a paid case. This is a bounded dependency engine and useful synthetic end-to-end demonstration only.
