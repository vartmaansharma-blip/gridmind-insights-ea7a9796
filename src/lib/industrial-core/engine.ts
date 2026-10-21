import {
  inputSchema,
  type CoreInput,
  type Action,
  type Rule,
  type Fact,
  type Verdict,
} from "./model";

import { assessOwnerIntents } from "./intent";
export const ALGORITHM = "gm-core-003/constraints-v1";
export function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
export async function digest(value: unknown): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(stable(value)));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}
export function evidenceReady(input: CoreInput, ids: string[], at: string): boolean {
  return (
    ids.length > 0 &&
    ids.every((id) => {
      const e = input.evidence.find((e) => e.id === id);
      return (
        e?.verification === "verified" &&
        Date.parse(e.observedAt) <= Date.parse(at) &&
        Date.parse(e.expiresAt) > Date.parse(at)
      );
    })
  );
}
function condition(rule: Rule, fact: Fact): boolean | null {
  const a = fact.value,
    b = rule.condition.value;
  if (a === null || fact.unit !== rule.condition.unit) return null;
  switch (rule.condition.op) {
    case "eq":
      return typeof a === typeof b ? a === b : null;
    case "in":
      return Array.isArray(b) && b.some((v) => typeof v === typeof a && v === a);
    case "gte":
      return typeof a === "number" && typeof b === "number" ? a >= b : null;
    case "lte":
      return typeof a === "number" && typeof b === "number" ? a <= b : null;
  }
}
export type RuleResult = {
  ruleId: string;
  version: number;
  status: Verdict;
  reason: string;
  evidenceIds: string[];
};
const rank: Record<Verdict, number> = {
  eligible: 0,
  conditional: 1,
  requires_review: 2,
  unknown: 3,
  prohibited: 4,
};
export const combine = (values: Verdict[]): Verdict =>
  values.reduce((a, b) => (rank[b] > rank[a] ? b : a), "eligible");
export function evaluateRule(input: CoreInput, action: Action, rule: Rule, at: string): RuleResult {
  const result = (status: Verdict, reason: string): RuleResult => ({
    ruleId: rule.id,
    version: rule.version,
    status,
    reason,
    evidenceIds: rule.evidenceIds,
  });
  if (rule.verification !== "verified" || !rule.verifiedBy)
    return result("requires_review", "RULE_NOT_VERIFIED");
  if (
    Date.parse(at) < Date.parse(rule.effectiveFrom) ||
    Date.parse(at) >= Date.parse(rule.expiresAt)
  )
    return result("unknown", "MANDATORY_RULE_NOT_CURRENT");
  if (!evidenceReady(input, rule.evidenceIds, at))
    return result("unknown", "RULE_EVIDENCE_MISSING_OR_STALE");
  if (rule.exception?.actionId === action.id) {
    if (!rule.exceptionPermitted || ["safety", "regulatory"].includes(rule.category))
      return result("requires_review", "EXCEPTION_NOT_PERMITTED_BY_VERIFIED_RULE");
    if (
      Date.parse(rule.exception.expiresAt) > Date.parse(at) &&
      evidenceReady(input, rule.exception.evidenceIds, at)
    )
      return result("conditional", "EXPLICIT_APPROVED_EXCEPTION_REQUIRES_ACTION_AUTHORIZATION");
    return result("requires_review", "EXCEPTION_EXPIRED_OR_UNVERIFIED");
  }
  const fact = action.facts[rule.condition.field];
  if (
    !fact ||
    fact.basis === "unknown" ||
    fact.value === null ||
    !evidenceReady(input, fact.evidenceIds, at)
  )
    return result("unknown", "FACT_MISSING_OR_STALE");
  const matched = condition(rule, fact);
  if (matched === null) return result("unknown", "INCOMPATIBLE_VALUE_OR_UNIT");
  if (fact.basis !== "record")
    return result("conditional", "ESTIMATE_OR_ASSUMPTION_REQUIRES_REVIEW");
  return (rule.effect === "require" ? !matched : matched)
    ? result("prohibited", "MANDATORY_REQUIREMENT_FAILED")
    : result("eligible", "CONDITION_SATISFIED");
}
// Derive authoritative quantities from the snapshot's typed operating records.
// No price, capacity or inventory is inferred from an AI explanation or a name match.
function operatingChecks(input: CoreInput, action: Action, at: string): RuleResult[] {
  const r: RuleResult[] = [];
  const add = (status: Verdict, reason: string, evidenceIds: string[]) =>
    r.push({ ruleId: "operating-model", version: 1, status, reason, evidenceIds });
  const product = input.entities.find((e) => e.id === action.productId && e.kind === "product");
  const orders = input.entities.filter(
    (e) =>
      e.kind === "order" &&
      e.attributes.productId === action.productId &&
      e.attributes.customerId === action.customerId,
  );
  if (!product || !orders.length) add("unknown", "ORDER_OR_PRODUCT_UNRESOLVED", []);
  else if (
    orders.some((o) => o.attributes.revision !== product.attributes.revision) ||
    action.facts.revision?.value !== product.attributes.revision
  )
    add("prohibited", "ORDER_PRODUCT_REVISION_MISMATCH", product.evidenceIds);
  for (const record of input.entities.filter(
    (e) => ["bom", "routing"].includes(e.kind) && e.attributes.productId === action.productId,
  ))
    if (record.attributes.revision !== product?.attributes.revision)
      add("prohibited", "ENGINEERING_REVISION_MISMATCH", record.evidenceIds);
  const bom = input.entities.find(
    (e) => e.kind === "bom" && e.attributes.productId === action.productId,
  );
  const materials = (bom?.attributes.materialIds ?? []) as string[];
  if (bom && materials.length === 1 && orders.length === 1) {
    const required =
      Number(orders[0].attributes.quantity) *
      Number((bom.attributes.quantities as Record<string, number>)[materials[0]]);
    const unit = (bom.attributes.quantityUnits as Record<string, string>)[materials[0]],
      available = action.facts.inventoryQuantity;
    if (
      !available ||
      available.value === null ||
      available.unit !== unit ||
      typeof available.value !== "number" ||
      !Number.isFinite(required)
    )
      add("unknown", "BOM_MATERIAL_COMPARISON_UNRESOLVED", bom.evidenceIds);
    else if (available.value < required)
      add("prohibited", "BOM_MATERIAL_REQUIREMENT_NOT_MET", bom.evidenceIds);
  } else add("unknown", "MULTI_MATERIAL_OR_ORDER_METHOD_NOT_IMPLEMENTED", bom?.evidenceIds ?? []);
  for (const record of [
    product,
    ...orders,
    ...input.entities.filter(
      (e) => ["bom", "routing"].includes(e.kind) && e.attributes.productId === action.productId,
    ),
  ].filter((e) => !!e)) {
    if (
      record.basis !== "record" ||
      !evidenceReady(input, record.evidenceIds, at) ||
      Date.parse(record.validFrom) > Date.parse(at) ||
      Date.parse(record.validUntil) <= Date.parse(at)
    )
      add("unknown", "ENGINEERING_SOURCE_NOT_CURRENT_OR_VERIFIED", record.evidenceIds);
  }
  for (const opId of action.operationIds) {
    const op = input.entities.find((e) => e.id === opId && e.kind === "operation");
    const resource = input.entities.find(
      (e) => e.id === op?.attributes.resourceId && e.kind === "resource",
    );
    if (!op || !resource) {
      add("unknown", "OPERATION_RESOURCE_UNRESOLVED", []);
      continue;
    }
    if (!evidenceReady(input, [...op.evidenceIds, ...resource.evidenceIds], at))
      add("unknown", "RESOURCE_EVIDENCE_NOT_CURRENT", resource.evidenceIds);
    const capability = input.entities.find(
      (e) =>
        e.kind === "capability" &&
        e.attributes.resourceId === resource.id &&
        e.attributes.processId === op.attributes.processId,
    );
    if (
      !capability ||
      capability.attributes.verification !== "verified" ||
      !evidenceReady(input, capability.evidenceIds, at)
    )
      add("requires_review", "MACHINE_CAPABILITY_UNVERIFIED", resource.evidenceIds);
    if (
      input.entities.some(
        (e) =>
          e.kind === "event" &&
          e.attributes.eventType === "downtime" &&
          Date.parse(String(e.attributes.at)) <= Date.parse(at) &&
          (e.attributes.subjectIds as string[]).includes(resource.id),
      )
    )
      add("prohibited", "RESOURCE_UNAVAILABLE", resource.evidenceIds);
    for (const entity of [op, resource, capability].filter((e) => !!e))
      if (
        Date.parse(entity.validFrom) > Date.parse(at) ||
        Date.parse(entity.validUntil) <= Date.parse(at)
      )
        add("unknown", "OPERATING_RECORD_NOT_CURRENT", entity.evidenceIds);
  }
  return r;
}
function derivedAction(input: CoreInput, raw: Action, at: string): Action {
  const fresh = (e: CoreInput["entities"][number]) =>
    e.basis === "record" &&
    Date.parse(e.validFrom) <= Date.parse(at) &&
    Date.parse(e.validUntil) > Date.parse(at) &&
    evidenceReady(input, e.evidenceIds, at);
  const action = structuredClone(raw);
  const bom = input.entities.find(
    (e) => e.kind === "bom" && e.attributes.productId === action.productId,
  );
  const materialIds = (bom?.attributes.materialIds ?? []) as string[];
  const lots = input.entities.filter(
    (e) =>
      e.kind === "lot" &&
      materialIds.includes(String(e.attributes.materialId)) &&
      e.attributes.producerId === action.facts.producer?.value,
  );
  const reservations = (lotId: string) =>
    input.entities.filter((e) => e.kind === "reservation" && e.attributes.lotId === lotId);
  const lotEvidence = lots.flatMap((e) => [
    ...e.evidenceIds,
    ...reservations(e.id).flatMap((r) => r.evidenceIds),
  ]);
  const quantities = lots.map((e) =>
    e.attributes.quality === "released"
      ? Number(e.attributes.quantity) -
        Math.max(
          Number(e.attributes.reserved),
          reservations(e.id).reduce((sum, r) => sum + Number(r.attributes.quantity), 0),
        )
      : 0,
  );
  const unit = lots[0]?.attributes.unit;
  const reservationMismatch = lots.some(
    (e) =>
      reservations(e.id).some((r) => r.attributes.unit !== e.attributes.unit) ||
      reservations(e.id).reduce((sum, r) => sum + Number(r.attributes.quantity), 0) !==
        Number(e.attributes.reserved),
  );
  if (
    materialIds.length === 1 &&
    lots.length &&
    lots.every((e) => e.attributes.unit === unit) &&
    !reservationMismatch &&
    quantities.every((q) => q >= 0)
  ) {
    action.facts.inventoryQuantity = {
      value: quantities.reduce((a, b) => a + b, 0),
      unit: String(unit),
      basis: lots.every((e) => fresh(e) && reservations(e.id).every(fresh)) ? "record" : "unknown",
      evidenceIds: lotEvidence,
    };
  } else
    action.facts.inventoryQuantity = {
      value: null,
      unit: "unknown",
      basis: "unknown",
      evidenceIds: bom?.evidenceIds ?? ["missing-inventory"],
    };
  const operations = input.entities.filter(
    (e) => action.operationIds.includes(e.id) && e.kind === "operation",
  );
  const resources = operations.map((op) =>
    input.entities.find((e) => e.id === op.attributes.resourceId && e.kind === "resource"),
  );
  const facilities = new Set(
    resources.filter((r) => !!r).map((r) => String(r.attributes.facilityId)),
  );
  const shifts = input.entities.filter(
    (e) =>
      e.kind === "shift" &&
      facilities.has(String(e.attributes.facilityId)) &&
      resources.some((r) => r?.id === e.attributes.resourceId),
  );
  // One resource/facility only in this bounded capacity method; multi-resource schedules stay unknown.
  if (resources.length === 1 && shifts.length && shifts.every(fresh))
    action.facts.capacityMinutes = {
      value: shifts.reduce((n, e) => n + Number(e.attributes.availableMinutes), 0),
      unit: "minute",
      basis: "record",
      evidenceIds: shifts.flatMap((e) => e.evidenceIds),
    };
  else
    action.facts.capacityMinutes = {
      value: null,
      unit: "minute",
      basis: "unknown",
      evidenceIds: operations.flatMap((e) => e.evidenceIds),
    };
  return action;
}
export function evaluate(inputValue: unknown, at: string) {
  const input = inputSchema.parse(inputValue);
  if (!Number.isFinite(Date.parse(at))) throw new Error("INVALID_EVALUATION_TIME");
  const snapshotCurrent =
    Date.parse(input.asOf) <= Date.parse(at) && Date.parse(input.validUntil) > Date.parse(at);
  const alternatives = input.actions.map((rawAction) => {
    const action = derivedAction(input, rawAction, at);
    const required = new Set(action.requiredRuleIds);
    const rules = input.constraints.filter(
      (r) =>
        required.has(r.id) ||
        ((!r.scope.customerId || r.scope.customerId === action.customerId) &&
          (!r.scope.productId || r.scope.productId === action.productId) &&
          r.scope.actionKinds.includes(action.kind)),
    );
    const checks: RuleResult[] = rules.map((rule) => {
      if (
        (rule.scope.customerId && rule.scope.customerId !== action.customerId) ||
        (rule.scope.productId && rule.scope.productId !== action.productId) ||
        !rule.scope.actionKinds.includes(action.kind)
      )
        return {
          ruleId: rule.id,
          version: rule.version,
          status: "unknown",
          reason: "MANDATORY_RULE_SCOPE_MISMATCH",
          evidenceIds: rule.evidenceIds,
        };
      return evaluateRule(input, action, rule, at);
    });
    checks.push(...operatingChecks(input, action, at));
    if (!snapshotCurrent)
      checks.push({
        ruleId: "snapshot",
        version: 1,
        status: "unknown",
        reason: "SNAPSHOT_NOT_CURRENT",
        evidenceIds: [],
      });
    const status = combine(checks.map((c) => c.status));
    return {
      actionId: action.id,
      label: action.label,
      status,
      checks,
      requiredAuthorities: action.requiredAuthorities,
    };
  });
  const eligible = alternatives.filter((a) => a.status === "eligible");
  const ownerIntentAssessment = assessOwnerIntents(input, alternatives, at);
  const unresolvedOwnerConflicts = ownerIntentAssessment.conflicts.length > 0;
  return {
    algorithmVersion: ALGORITHM,
    evaluatedAt: at,
    inputSnapshot: input,
    constraintVersions: input.constraints.map((r) => ({ id: r.id, version: r.version })),
    assumptions: input.actions.flatMap((a) =>
      Object.entries(a.facts)
        .filter(([, f]) => f.basis !== "record")
        .map(([field, f]) => ({ actionId: a.id, field, ...f })),
    ),
    alternatives,
    excludedAlternatives: alternatives
      .filter((a) => a.status !== "eligible")
      .map((a) => ({
        actionId: a.actionId,
        status: a.status,
        reasons: a.checks.filter((c) => c.status !== "eligible"),
      })),
    ownerIntentAssessment,
    recommendation: eligible.length === 1 && !unresolvedOwnerConflicts ? eligible[0].actionId : null,
    disposition:
      unresolvedOwnerConflicts
        ? "owner_intent_conflict_requires_review"
        : eligible.length === 1
        ? "review_recommended_action"
        : eligible.length > 1
          ? "compare_eligible_alternatives"
          : alternatives.every((a) => a.status === "prohibited")
            ? "no_permitted_alternative"
            : "insufficient_information_or_review",
    disruptionImpacts: input.entities
      .filter(
        (e) =>
          e.kind === "event" &&
          ["downtime", "delay"].includes(String(e.attributes.eventType)) &&
          Date.parse(String(e.attributes.at)) <= Date.parse(at) &&
          evidenceReady(input, e.evidenceIds, at),
      )
      .map((e) => disruptionImpact(input, e.id)),
    optimization: "not_performed",
    actualOutcome: null,
    verifiedSavings: null,
    customerRelease: false,
  } as const;
}
export type Evaluation = ReturnType<typeof evaluate>;
// Conservative impact trace over explicit dependencies and typed operating links.
// It reports affected records, not a predicted delivery delay or optimized schedule.
export function disruptionImpact(input: CoreInput, eventId: string) {
  const event = input.entities.find((e) => e.id === eventId && e.kind === "event");
  if (!event) throw new Error("UNKNOWN_EVENT");
  const affected = new Set(event.attributes.subjectIds as string[]);
  for (let i = 0; i < input.entities.length; i++) {
    for (const edge of input.relationships)
      if (affected.has(edge.to) && ["requires", "precedes"].includes(edge.type))
        affected.add(edge.from);
    for (const entity of input.entities) {
      const a = entity.attributes;
      const links =
        entity.kind === "operation"
          ? [a.resourceId, a.processId, ...(a.predecessorIds as string[])]
          : entity.kind === "process"
            ? (a.inputIds as string[])
            : entity.kind === "routing"
              ? (a.operationIds as string[])
              : entity.kind === "order"
                ? [a.productId]
                : entity.kind === "work_order"
                  ? [a.orderId, a.routingId]
                  : [];
      if (links.some((v) => affected.has(String(v)))) affected.add(entity.id);
      if (["process", "routing", "bom"].includes(entity.kind) && affected.has(entity.id)) {
        if (typeof a.productId === "string") affected.add(a.productId);
        if (Array.isArray(a.outputIds)) for (const id of a.outputIds) affected.add(String(id));
      }
      if (["commitment", "lot"].includes(entity.kind) && affected.has(entity.id))
        affected.add(String(a.materialId));
      if (entity.kind === "bom" && (a.materialIds as string[]).some((id) => affected.has(id))) {
        affected.add(entity.id);
        affected.add(String(a.productId));
      }
    }
  }
  return {
    eventId,
    affected: input.entities
      .filter((e) => affected.has(e.id))
      .map((e) => ({ id: e.id, kind: e.kind })),
  };
}
export function applyDisruption(input: CoreInput, eventId: string, at: string): CoreInput {
  const next = structuredClone(input),
    event = next.entities.find((e) => e.id === eventId && e.kind === "event");
  if (
    !event ||
    !evidenceReady(next, event.evidenceIds, at) ||
    Date.parse(String(event.attributes.at)) > Date.parse(at)
  )
    throw new Error("UNVERIFIED_EVENT");
  const affected = new Set(disruptionImpact(next, eventId).affected.map((e) => e.id));
  for (const a of next.actions)
    if (affected.has(a.productId) || a.operationIds.some((op) => affected.has(op))) {
      a.facts.processReady = {
        value: false,
        unit: "boolean",
        basis: "record",
        evidenceIds: event.evidenceIds,
      };
    }
  next.asOf = at;
  next.sourceId = `event:${eventId}`;
  return inputSchema.parse(next);
}
