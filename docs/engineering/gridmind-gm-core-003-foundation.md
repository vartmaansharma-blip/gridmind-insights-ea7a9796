# GM-CORE-003 — Shared industrial intelligence foundation

**Status:** implemented synthetic engineering candidate; independent security/domain review and release authorization pending. **Owner:** engineering. **Scope:** supporting implementation contract, not another strategy or ERP. Refs [#166](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/166), [Master Plan](../gridmind-master-plan-2026-10-11.md), [Constitution](../gridmind-decision-constitution-and-contradiction-register-2026-10-10.md), [sole buyer tracker](../gridmind-buyer-discovery-sprint-2026-10-11.md). No main merge or production/customer use is authorized by this task.

## Existing foundation and reconciliation

Audit base: main `847ad16d8b43b2bf39f476e8e355ebb4cc21b23c` (merged #163). Actual stack is **TanStack Start / React / Vite / Bun / Supabase PostgreSQL**, not Next.js. Keep Lovable wrapper/config, generated integrations, public `/`, `/dashboard`, `/design-preview`, `/website`, green #9ADD00, electricity, C1/C4 and compressed air.

Reuse existing organization/factory/member/Auth identities, bounded request reader, server-only credential pattern, canonical evidence/unknown/review/action discipline, immutable revision/CAS/receipt pattern, existing UI Button and synthetic workspace. Do not change C1/C4 enums into a new professional method. The manufacturing operating workspace is a new bounded aggregate linked to canonical organization and plant IDs, not another tenant/identity system or replacement investigation engine. No AI provider or new dependency is required; AI narration cannot write authority, inventory or results.

At audit, #154/#156/#158/#160/#162 had conflicts with main, #150 was behind, and #165 was a separate draft strategy/specification. Preserve each unique implementation and independent-review ownership. This branch does not merge them. `/investigations` is an explicit overlap with #160/#162; reconcile route composition and canonical notes before any future integration. #165's proposed C20-09 identifier also collides with an earlier merged decision identifier; this task uses **GM-CORE-003-AUTH**, not a silent renumbering/adoption of that draft.

## Module boundaries and working request path

| Module                                                      | Responsibility                                                                                                                                                                                     |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/industrial-core/model.ts`                          | Strict schemas, typed entity attributes/references, provenance, scope/version/date validation, BOM units/quantities and acyclic operation dependencies.                                            |
| `engine.ts`                                                 | Deterministic rule application, operating-record derivation, exclusions, dispositions, original input/constraint/algorithm retention, disruption propagation and canonical input/decision SHA-256. |
| `economics.ts`                                              | Bounded integer minor-unit incremental contribution/ranges; explicit missing, incompatible-currency and infeasible states.                                                                         |
| `opportunities.ts`                                          | Record-specific bilateral sharing checks, specification/revision/unit/demand/quality/qualification/contract and uncommitted quantity checks; potential matches only.                               |
| `workflow.ts`                                               | Fourteen transaction categories, authority mapping, independent approval, current-grant checks, internal execution/failure and unavailable payment-provider interfaces.                            |
| `service.ts`                                                | Validated commands, server-authoritative scope/context/time, source verification, approvals, immutable snapshots, receipt retry and CAS orchestration.                                             |
| `core.server.ts` + `/api/industrial-core`                   | Same-origin bounded POST, fixed public synthetic replay, or default-disabled loopback-only persistence with verified Auth user, bound live session and server-only RPC.                            |
| `fixtures.ts` + `data/industrial-core/synthetic-source.txt` | Invented, historical four-scenario replay. Exact source bytes/digest, explicit simulated verification/sharing and no real company attribution.                                                     |
| `IndustrialCoreWorkspace` in existing `/investigations`     | Calls the actual backend, displays alternatives/reasons/source/rule versions, operating records, approval/execution/outcome and optional isolated authenticated storage.                           |

The public demonstration calls real deterministic backend functions with a fixed scenario ID; it does not mock a network response, accept arbitrary documents, open the database or execute a provider. The authenticated path runs the same constraint kernel over independently reviewed synthetic inputs with real PostgreSQL revisions and explicit capability grants. The UI does not implement private operator grant provisioning.

## Knowledge and manufacturer model

All snapshots are organization-owned, schema-versioned, synthetic-origin and time-bounded. Entity records include ID/kind/version, owner organization, record/estimate/assumption/unknown basis, source evidence and validity interval. Relations reference known typed entities. Original snapshots remain immutable; source correction invalidates evaluation and approvals, increments changed entity/rule versions, and retains prior values in history.

Implemented typed kinds cover industry/subindustry; company/legal organization; facility; product/component/revision; material/specification; process; machine/work-center/line/labor resource; proposed/verified capability; customer/supplier relationship; BOM with material quantities/units; customer order/revision; work order; routing/operation/predecessors; resource shift calendar; lot/manufacturing producer/quality/reservation; supplier commitment; production/downtime/delay/quality/business event; inspection; shipment; invoice; constraint; decision reference; demand and opportunity. Contract/regulatory/safety constraints live in versioned rule records with evidence, rather than implied labels. Existing organizations/factories/assets can be referenced without fabricating new operational facts.

A lot records its producer, quantity, unit, reserved amount and quality. Inventory evaluation derives uncommitted released quantity from typed lots and consistent reservations; a submitted `inventoryQuantity` fact cannot override it. Capacity derives from the selected resource's shift availability; a submitted capacity fact cannot override it. Product/order/BOM/routing revisions must agree. Different materials are never summed as fungible stock. Unsupported multi-material/multi-resource/order scheduling returns unknown. This is a snapshot comparison, not a live inventory ledger or temporal production optimizer.

## Constraint engine

Fifteen categories cover customer, approved source, specification, contract, revision, process dependency, machine, capacity, inventory, quality, employee qualification, financial limits, policy, regulation and safety. Each rule retains ID, organization, version, source evidence, product/customer/action scope, effective/expiry times, structured field/operator/value/unit, required/prohibited effect, verification status, responsible capability, reviewer and optional approved exception.

Operators are bounded equality/membership/numeric lower/upper comparisons; no executable document expressions or AI formulas. Imported sources/capabilities/rules are unverified/proposed regardless of supplied flags; exceptions are stripped. An independent actor with explicit relevant capabilities verifies them. Role labels such as administrator do not grant this authority. Source verification in this slice is a synthetic workflow, not a real professional attestation.

Every applicable rule is evaluated; mandatory expired/future/missing-scope rules are unknown, not silently ignored. Unverified rules require review; missing/future/expired evidence, incompatible units or unknown facts fail closed. Estimates stay conditional. Conflicting mandatory requirements prohibit/escalate the alternative, never override by price or rule ordering. An exception must be explicitly permitted by a verified rule, source-supported, action-specific, independently authorized and expire no later than the rule. Safety/regulatory exceptions are not supported. Approved exceptions remain conditional until separate action authorization; other conditional/unknown results cannot execute.

## Decision lifecycle and audit

Command path: create/import/detect event → validate evidence/model → evaluate all applicable constraints → identify permitted supplied alternatives/exclusions → preserve explainable recommendation or comparison/unknown → request scoped approval → independent authority → internal synthetic execution → source-backed observed internal result or inconclusive/unverified outcome → retain full history.

Each decision retains its original input, exact constraint versions, algorithm version, assumptions, every alternative and exclusion reason, recommendation/disposition, required authorities, execution reference/state and outcome. Source changes and reevaluation clear prior approval/workflow. Freshness and current approver grants are checked again before execution. No permitted alternative is an explicit result; eligible alternatives are not ranked by a hidden optimizer. Candidate generation is limited to the source-supplied bounded candidate set, not general planning/search.

The workspace journal preserves actor, database time, command/request fingerprint, input/decision digests, prior link and immutable snapshot/entry hashes. Read/receipt operations verify the retained chain. Hashing is PostgreSQL UTF-8 jsonb text for journal custody and canonical sorted JSON for application input/decision binding; they are different contracts. Neither is a signed authenticity or engineering certificate. Database administrators remain trusted and can defeat triggers; ordinary API/service callers cannot directly edit history.

## Economics and cross-company opportunities

One reproducible kernel accepts make/outsource, buy/use-stock, sell/retain, accept-order/reserve-capacity and supplier/route/schedule option interfaces. It subtracts incremental, opportunity, transport and storage costs from supplied revenue in one currency's integer minor units, retaining timing and uncertainty ranges. Missing values are not zero; unsafe integers, invalid prices and currency mismatches fail or return insufficient information. No FX, NPV, market prices, optimal schedule, attribution or verified savings is invented. Feasibility/source qualification must come from the caller's reviewed decision context; this arithmetic module grants no action authority.

Matching distinguishes surplus versus capacity, potential versus verified demand, uncommitted quantity, technical specification/revision/unit, supplier qualification, quality and contractual eligibility. A name match cannot qualify a trade. Without unexpired, record-specific bilateral owner grants, no private stock/demand/quantity details are returned. Complete technical qualification still returns a **conditional potential opportunity**, requiring commercial authorization.

`private.industrial_core_sharing` stores controlled owner/counterparty grants. This slice does not expose a marketplace, publish private data, solicit buyers or connect two live tenant inventories. The public cross-industry replay uses explicitly simulated grants; future cross-tenant retrieval must load authentic grants and minimized authorized capsules through a separately reviewed adapter, not caller-provided booleans.

## Workflows and external source-of-truth boundaries

Supported categories: inquiry, quotation, order acceptance, material requirement, purchase requisition, purchase order, production scheduling, work assignment, quality release, dispatch, invoice, payment status, exception and reconciliation. Internal phases: awaiting approval → approved → completed, or failed/cancelled; executing supports interrupted internal recovery. Source changes invalidate the bound decision; revoked approval rights block execution.

Commercial, quality, safety and finance capabilities are separate from administration. Supported execution is an **internal synthetic record step**, not a live PO, order, dispatch, ERP write or physical action. A failed step is saved as failed/inconclusive; receipt retry does not duplicate a committed command. No external provider is wired. `payment_status` stops at awaiting-provider/unverified, and input invoice records cannot assert confirmed payment. The future payment interface requires a provider-confirmed receipt; a click cannot mark success. Internal completion is not verified industrial effectiveness.

## PostgreSQL schema, isolation and migration

Source migration: `supabase/migrations/20261020174914_industrial_core_foundation.sql`, created with Supabase CLI 2.121.0. It is transactional and unmerged/source-only; never apply it to the shared project as part of this task.

| Object                                | Boundary                                                                                                                                                                             |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `industrial_core_workspaces`          | Canonical organization/factory FKs, synthetic origin, creation identity and current revision.                                                                                        |
| `industrial_core_revisions`           | Workspace FK, immutable bounded JSON snapshots, unique request key, fingerprint, command/actor/time, prior/entry/snapshot digests; maximum 200 revisions without discarding history. |
| `private.industrial_core_authorities` | Explicit plant/user/capability/expiry/grantor/basis, current canonical organization/factory membership required; no automatic bootstrap grants.                                      |
| `private.industrial_core_sharing`     | Owner/counterparty/record/approver/expiry/basis; controlled provisioning, no automatic publishing.                                                                                   |
| `private.industrial_core_gate`        | Default OFF; missing row also denies. Browser feature flags cannot bypass the database gate.                                                                                         |
| `industrial_core_store`               | Service-role-only public invoker wrapper over a narrowly scoped private definer; no authenticated/anonymous forged actor RPC.                                                        |

Public tables have RLS and read-only authenticated grants, bound to current explicit read capability, active organization/membership and live session ID. Private tables have RLS and no client/service direct grants. Direct writes are revoked even from the service role; the private transaction function owns writes. No actor argument is trusted from the browser: server verifies the exact JWT with Auth, extracts its session only after verification, and DB checks session/user binding and expiry. Deleting the session, revoking membership/grant or suspending the organization blocks access/retry. The server also rejects anonymous Auth and refuses remote/non-loopback persistence endpoints.

Advisory transaction locking serializes initial creation and append. Exact request replay returns its frozen receipt; changed payload under the same key conflicts. Revision mismatch rejects concurrent stale writers; duplicate source/event IDs cannot append under fresh request keys. No partial save on a failed constraint. Source/data/authority correction uses new revisions. Rollback: disable gate/feature, ordinary revert/forward repair; do not drop retained evidence or fabricate migration history. Production remains separately gated by #29/#130/#150 and independent security review.

## Four executable synthetic demonstrations

| Scenario              | Actual implemented path and expected evidence                                                                                                                                                                                                                                     |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A — Automotive order  | Typed product R2, BOM/material/lot/reservation, resource/routing/shift and verified fictional rules. Approved material is a candidate; unapproved producer is excluded. No full production optimizer or actual approval.                                                          |
| B — Cross-industry    | Known uncommitted quantity and simulated bilateral sharing; compatible technical fields are insufficient because supplier qualification and verified demand are missing. Opportunity requires review and economics returns insufficient information where retain value is absent. |
| C — Disruption        | Record machine downtime, traverse resource/operation/product dependency, invalidate feasibility and return exclusions/no supported action; preserve approval/outcome state. No machine control.                                                                                   |
| D — Prohibited source | Fictional contract permits a designated fictional producer; cheaper unapproved producer is blocked with rule/version/source reason. No rule attributed to Tata Motors or another real company.                                                                                    |

Run through the minimal workspace on `/investigations`, `POST /api/industrial-core` with `{ "action": "demo", "scenario": "A" }` (B/C/D likewise), or `bun scripts/industrial-core-demo.ts`. The default HTTP replay accepts only a strict scenario ID, not caller-supplied private inputs. Authenticated workspace requires a disposable local Supabase stack, explicit native/fixture capability provisioning and independent users; creating the schema grants nobody authority.

New authenticated bundled workspaces instantiate the invented template at the trusted database creation time, retaining the exact source digest and explicit `syntheticClock` template/instantiation metadata. Relative timestamps shift only during creation; saved snapshots and supplied imports never refresh automatically. Historical public replays retain their fixed original period. This clock transformation is synthetic fixture generation, not new factory evidence.

## Verification and limitations

```sh
bun run docs:links
bun run typecheck
bun run lint
bun run test
bun run build
cd e2e && bun run test:synthetic
# separate terminal, after installing verification's existing locked dependencies:
cd verification && bun postgres-acceptance.ts
```

Unit/API tests exercise four scenarios, fifteen rule categories, tenant ownership/reference validation, revision/BOM/route consistency, actual inventory/capacity derivation, stale/missing/conflicting evidence, prohibited source, economics, unqualified matches, sharing, approval authority/revocation, payment refusal and failed execution. Native PostgreSQL replay exercises real RLS/RPC/default-off/current identity, append-only custody, receipts/altered retry, duplicate source, lost-response recovery and two-connection CAS. Existing migration schema checks assert new grants/RLS/defaults. Browser tests call the actual HTTP replay and inspect desktop/mobile result/authority behavior alongside preserved tests.

Native Auth/Storage catalogs are fixtures, **not Supabase Auth/PostgREST HTTP proof**. API unit tests mock Auth transport; they do not replace native SQL tests or a real authenticated HTTP acceptance run. The existing hosted full-stack pipeline now includes `industrial-core-authenticated.pw.ts`: real disposable Auth/HTTP, UI creation/read-back, independent review/approval, frozen retry, foreign-tenant denial and authority revocation. It provisions synthetic grants through guarded loopback SQL and disables the gate afterward. Its exact final-head result must be recorded separately; native tests do not imply that this hosted test passed. No production advisors/live-schema/customer-data audit or independent human security/domain review is completed here. Exact commands, final SHA/results and outstanding hosted checks belong in #166/the PR, not self-approved prose.

Next bounded dependency: independently review this tenant/session/authority/RPC/method boundary and its final-head populated Auth/HTTP/browser acceptance evidence, including controlled grant provisioning, read-back/revocation and saved decision/receipt integrity. Do not expand the optimizer, marketplace, payment/ERP providers or commercial promise before that gate.

Documentation references checked: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [database functions](https://supabase.com/docs/guides/database/functions), [current changelog](https://supabase.com/changelog), [PostgreSQL security minor-release changes](https://supabase.com/changelog/postgres-15-19-17-11-breaking-changes). No ltree/custom operator/legacy encryption or new package feature is used; no production update follows from documentation review.
