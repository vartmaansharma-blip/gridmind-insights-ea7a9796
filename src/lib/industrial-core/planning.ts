import { z } from "zod";
import { id, instant, inputSchema, type CoreInput, type Entity } from "./model";
import { evidenceReady, evaluateRule, digest } from "./engine";
import { assessOwnerIntents } from "./intent";

const quantity = z.number().int().positive().safe();
const interval = { startsAt: instant, endsAt: instant };
export const operatingPlanSchema = z
  .object({
    origin: z.literal("synthetic"),
    schemaVersion: z.literal("gm-operations-plan/v1"),
    id,
    ...interval,
    evidenceIds: z.array(id).min(1).max(10),
    jobs: z
      .array(
        z
          .object({
            workOrderId: id,
            actionId: id,
            evidenceIds: z.array(id).min(1).max(10),
            allocations: z
              .array(z.object({ lotId: id, quantity, unit: id }).strict())
              .min(1)
              .max(30),
            steps: z
              .array(
                z
                  .object({
                    operationId: id,
                    evidenceIds: z.array(id).min(1).max(10),
                    candidates: z
                      .array(
                        z
                          .object({
                            resourceId: id,
                            setupMinutes: z.number().finite().nonnegative().max(1440),
                            minutesPerUnit: z.number().finite().positive().max(1440),
                          })
                          .strict(),
                      )
                      .min(1)
                      .max(15),
                    toolIds: z.array(id).max(10),
                    laborIds: z.array(id).min(1).max(10),
                    externalReadyAt: instant.nullable(),
                    inspectionIds: z.array(id).max(10),
                  })
                  .strict(),
              )
              .min(1)
              .max(30),
          })
          .strict(),
      )
      .min(1)
      .max(20),
    unavailable: z
      .array(
        z
          .object({
            id,
            resourceId: id,
            ...interval,
            reason: z.enum(["committed_work", "planned_maintenance", "observed_downtime"]),
            evidenceIds: z.array(id).min(1).max(10),
          })
          .strict(),
      )
      .max(100),
  })
  .strict()
  .superRefine((plan, ctx) => {
    const issue = (message: string) => ctx.addIssue({ code: "custom", message });
    if (Date.parse(plan.endsAt) <= Date.parse(plan.startsAt)) issue("Invalid planning horizon");
    if (new Set(plan.jobs.map((j) => j.workOrderId)).size !== plan.jobs.length)
      issue("Duplicate work order");
    if (new Set(plan.jobs.map((j) => j.actionId)).size !== plan.jobs.length)
      issue("Each job needs its scoped action");
    if (new Set(plan.unavailable.map((b) => b.id)).size !== plan.unavailable.length)
      issue("Duplicate unavailable interval");
    for (const busy of plan.unavailable)
      if (Date.parse(busy.endsAt) <= Date.parse(busy.startsAt))
        issue("Invalid unavailable interval");
    for (const job of plan.jobs) {
      if (new Set(job.steps.map((s) => s.operationId)).size !== job.steps.length)
        issue("Duplicate routing step");
      if (new Set(job.allocations.map((a) => a.lotId)).size !== job.allocations.length)
        issue("Duplicate lot allocation");
      for (const step of job.steps) {
        if (new Set(step.candidates.map((c) => c.resourceId)).size !== step.candidates.length)
          issue("Duplicate candidate resource");
        if (
          new Set([...step.toolIds, ...step.laborIds]).size !==
          step.toolIds.length + step.laborIds.length
        )
          issue("Duplicate supporting resource");
      }
    }
  });
export type OperatingPlan = z.infer<typeof operatingPlanSchema>;
type Window = { start: number; end: number };
export type PlanningIssue = {
  code: string;
  status: "unknown" | "blocked" | "requires_review";
  ids: string[];
};
class PlanBlocked extends Error {
  constructor(readonly issue: PlanningIssue) {
    super(issue.code);
  }
}
function refuse(
  code: string,
  ids: string[] = [],
  status: PlanningIssue["status"] = "unknown",
): never {
  throw new PlanBlocked({ code, ids, status });
}
export type ScheduledTask = {
  workOrderId: string;
  orderId: string;
  actionId: string;
  operationId: string;
  resourceId: string;
  toolIds: string[];
  laborIds: string[];
  predecessorIds: string[];
  startsAt: string;
  endsAt: string;
  quantity: number;
  quantityUnit: string;
  setupMinutes: number;
  runMinutes: number;
  evidenceIds: string[];
};
export type PlanningResult = Awaited<ReturnType<typeof planOperations>>;

/** Bounded, non-preemptive earliest-due/earliest-finish heuristic. Never optimality or authority. */
export async function planOperations(rawInput: unknown, rawPlan: unknown, at: string) {
  const input = inputSchema.parse(rawInput),
    plan = operatingPlanSchema.parse(rawPlan);
  const now = Date.parse(at),
    horizon = { start: Date.parse(plan.startsAt), end: Date.parse(plan.endsAt) };
  if (!Number.isFinite(now)) throw new Error("INVALID_PLANNING_TIME");
  const inputDigest = await digest(input),
    planDigest = await digest(plan);
  const entities = new Map(input.entities.map((e) => [e.id, e]));
  const get = (key: string, kind: Entity["kind"]) => {
    const record = entities.get(key);
    if (!record || record.kind !== kind) return refuse("MISSING_OR_INCORRECT_ENTITY", [key]);
    return record;
  };
  const current = (record: Entity, through = at) => {
    if (
      record.basis !== "record" ||
      Date.parse(record.validFrom) > now ||
      Date.parse(record.validUntil) <= Date.parse(through) ||
      !evidenceReady(input, record.evidenceIds, at) ||
      !evidenceReady(input, record.evidenceIds, through)
    )
      refuse("SOURCE_NOT_VERIFIED_OR_CURRENT", [record.id]);
    return record;
  };
  const evidence = (ids: string[], through = at) => {
    if (!evidenceReady(input, ids, at) || !evidenceReady(input, ids, through))
      refuse("PLAN_EVIDENCE_NOT_VERIFIED_OR_CURRENT", ids);
  };
  const bookings = new Map<string, Window[]>();
  const addBooking = (key: string, window: Window) =>
    bookings.set(key, [...(bookings.get(key) ?? []), window]);
  const allTasks: ScheduledTask[] = [];
  const jobs: {
    workOrderId: string;
    orderId: string | null;
    status: "candidate" | "blocked";
    issues: PlanningIssue[];
    dueAt: string | null;
    late: boolean | null;
    allocations: OperatingPlan["jobs"][number]["allocations"];
  }[] = [];
  let free = new Map<string, number>(),
    owned = new Map<string, number>();
  const lotKey = (lot: string, order: string) => JSON.stringify([lot, order]);
  const globalIssues: PlanningIssue[] = [];
  try {
    if (
      now < Date.parse(input.asOf) ||
      now >= Date.parse(input.validUntil) ||
      horizon.start < now ||
      horizon.end > Date.parse(input.validUntil)
    )
      refuse("SNAPSHOT_OR_PLANNING_HORIZON_NOT_CURRENT");
    evidence(plan.evidenceIds, new Date(horizon.end - 1).toISOString());
    const workOrderIds = new Set(plan.jobs.map((job) => job.workOrderId));
    const uncovered = input.entities.filter(
      (e) => e.kind === "work_order" && !workOrderIds.has(e.id),
    );
    if (uncovered.length)
      refuse(
        "UNPLANNED_WORK_ORDERS_REQUIRE_SCOPE_REVIEW",
        uncovered.map((e) => e.id),
      );
    // Existing asset aliases cannot be treated as separate exclusive machines.
    const assets = input.entities.filter(
      (e) => e.kind === "resource" && e.attributes.assetRef !== null,
    );
    if (new Set(assets.map((e) => e.attributes.assetRef)).size !== assets.length)
      refuse(
        "AMBIGUOUS_DUPLICATE_ASSET_IDENTITY",
        assets.map((e) => e.id),
      );
    for (const busy of plan.unavailable) {
      current(get(busy.resourceId, "resource"));
      evidence(busy.evidenceIds);
      addBooking(busy.resourceId, {
        start: Date.parse(busy.startsAt),
        end: busy.reason === "observed_downtime" ? horizon.end : Date.parse(busy.endsAt),
      });
    }
    for (const lot of input.entities.filter((e) => e.kind === "lot")) {
      const reservations = input.entities.filter(
        (e) => e.kind === "reservation" && e.attributes.lotId === lot.id,
      );
      const reserved = reservations.reduce((sum, r) => sum + Number(r.attributes.quantity), 0);
      if (
        !Number.isSafeInteger(lot.attributes.quantity) ||
        !Number.isSafeInteger(reserved) ||
        reserved !== lot.attributes.reserved ||
        reserved > Number(lot.attributes.quantity) ||
        reservations.some((r) => r.attributes.unit !== lot.attributes.unit)
      )
        refuse("INVENTORY_RESERVATION_OR_BASE_UNIT_CONFLICT", [lot.id]);
      free.set(lot.id, Number(lot.attributes.quantity) - reserved);
      for (const reservation of reservations) {
        current(reservation);
        const key = lotKey(lot.id, String(reservation.attributes.orderId));
        owned.set(key, (owned.get(key) ?? 0) + Number(reservation.attributes.quantity));
      }
    }
  } catch (error) {
    if (!(error instanceof PlanBlocked)) throw error;
    globalIssues.push(error.issue);
  }
  const calendars = new Map<string, Window[]>();
  const calendar = (resourceId: string) => {
    if (calendars.has(resourceId)) return calendars.get(resourceId)!;
    const resource = current(get(resourceId, "resource"));
    const facility = current(get(String(resource.attributes.facilityId), "facility"));
    if (facility.attributes.factoryRef !== input.factoryId)
      refuse("RESOURCE_OUTSIDE_PLANT", [resourceId]);
    const shifts = input.entities.filter(
      (e) => e.kind === "shift" && e.attributes.resourceId === resourceId,
    );
    if (!shifts.length) refuse("RESOURCE_CALENDAR_MISSING", [resourceId]);
    const windows = shifts
      .map((shift) => {
        current(
          shift,
          new Date(
            Math.min(horizon.end, Date.parse(String(shift.attributes.endsAt))) - 1,
          ).toISOString(),
        );
        if (shift.attributes.facilityId !== facility.id)
          refuse("SHIFT_FACILITY_CONFLICT", [shift.id]);
        const start = Date.parse(String(shift.attributes.startsAt)),
          end = Date.parse(String(shift.attributes.endsAt));
        // A net budget cannot locate undisclosed breaks: require explicit usable time windows.
        if ((end - start) / 60_000 !== shift.attributes.availableMinutes)
          refuse("CALENDAR_BREAKS_NOT_LOCATED", [shift.id]);
        return { start: Math.max(start, horizon.start), end: Math.min(end, horizon.end) };
      })
      .filter((w) => w.end > w.start)
      .sort((a, b) => a.start - b.start);
    if (windows.some((window, i) => i > 0 && window.start < windows[i - 1].end))
      refuse("OVERLAPPING_RESOURCE_CALENDARS", [resourceId]);
    calendars.set(resourceId, windows);
    return windows;
  };
  const slot = (resourceId: string, earliest: number, duration: number): number | null => {
    for (const window of calendar(resourceId)) {
      let start = Math.max(earliest, window.start);
      for (const busy of [...(bookings.get(resourceId) ?? [])].sort((a, b) => a.start - b.start)) {
        if (start + duration <= busy.start) break;
        if (start < busy.end && start + duration > busy.start) start = busy.end;
      }
      if (start + duration <= window.end) return start;
    }
    return null;
  };
  const simultaneousSlot = (
    resourceIds: string[],
    earliest: number,
    duration: number,
  ): number | null => {
    let start = earliest;
    // Every successful jump moves past a window/busy boundary; bound pathological inputs.
    for (let attempt = 0; attempt < 1000; attempt++) {
      const next = resourceIds.map((resourceId) => slot(resourceId, start, duration));
      if (next.some((value) => value === null)) return null;
      const advanced = Math.max(...(next as number[]));
      if (advanced === start) return start;
      start = advanced;
    }
    return refuse("SCHEDULING_SEARCH_BOUND_REACHED", resourceIds);
  };
  const ordered = [...plan.jobs].sort((a, b) => {
    const due = (job: typeof a) => {
      const workOrder = entities.get(job.workOrderId),
        order = entities.get(String(workOrder?.attributes.orderId));
      return Date.parse(String(order?.attributes.dueAt)) || Infinity;
    };
    return due(a) - due(b) || a.workOrderId.localeCompare(b.workOrderId);
  });
  for (const job of ordered) {
    const beforeFree = new Map(free),
      beforeOwned = new Map(owned);
    const beforeBookings = new Map([...bookings].map(([key, value]) => [key, [...value]]));
    const taskCount = allTasks.length;
    let orderId: string | null = null,
      dueAt: string | null = null;
    try {
      if (globalIssues.length) throw new PlanBlocked(globalIssues[0]);
      evidence(job.evidenceIds);
      const wo = current(get(job.workOrderId, "work_order"));
      const order = current(get(String(wo.attributes.orderId), "order"));
      orderId = order.id;
      dueAt = String(order.attributes.dueAt);
      const product = current(get(String(order.attributes.productId), "product"));
      const routing = current(get(String(wo.attributes.routingId), "routing"));
      const action = input.actions.find((a) => a.id === job.actionId);
      if (
        !action ||
        action.productId !== product.id ||
        action.customerId !== order.attributes.customerId
      )
        refuse("JOB_ACTION_SCOPE_CONFLICT", [job.actionId]);
      if (
        !Number.isSafeInteger(wo.attributes.quantity) ||
        Number(wo.attributes.quantity) > Number(order.attributes.quantity)
      )
        refuse("WORK_ORDER_QUANTITY_CONFLICT", [wo.id]);
      const siblingQuantity = input.entities
        .filter((e) => e.kind === "work_order" && e.attributes.orderId === order.id)
        .reduce((sum, e) => sum + Number(e.attributes.quantity), 0);
      if (siblingQuantity > Number(order.attributes.quantity))
        refuse("ORDER_OVERCOMMITTED_BY_WORK_ORDERS", [order.id]);
      const boms = input.entities.filter(
        (e) => e.kind === "bom" && e.attributes.productId === product.id,
      );
      if (boms.length !== 1) refuse("BOM_UNRESOLVED_OR_AMBIGUOUS", [product.id]);
      const bom = current(boms[0]);
      if (
        order.attributes.revision !== product.attributes.revision ||
        bom.attributes.revision !== product.attributes.revision ||
        routing.attributes.revision !== product.attributes.revision ||
        routing.attributes.productId !== product.id
      )
        refuse(
          "ENGINEERING_REVISION_CONFLICT",
          [order.id, product.id, bom.id, routing.id],
          "blocked",
        );
      const operationIds = routing.attributes.operationIds as string[];
      if (
        job.steps.length !== operationIds.length ||
        job.steps.some((s) => !operationIds.includes(s.operationId)) ||
        action.operationIds.length !== operationIds.length ||
        action.operationIds.some((key) => !operationIds.includes(key))
      )
        refuse("INCOMPLETE_ROUTING_OR_ACTION", [routing.id, job.actionId]);
      const materialIds = bom.attributes.materialIds as string[];
      const totals = new Map<string, number>();
      const usedProducers = new Set<string>();
      let availableForRules = 0;
      for (const allocation of job.allocations) {
        const lot = current(get(allocation.lotId, "lot"));
        const materialId = String(lot.attributes.materialId),
          material = current(get(materialId, "material"));
        if (
          !materialIds.includes(materialId) ||
          allocation.unit !== lot.attributes.unit ||
          allocation.unit !== material.attributes.unit ||
          allocation.unit !== (bom.attributes.quantityUnits as Record<string, string>)[materialId]
        )
          refuse("MATERIAL_OR_UNIT_MISMATCH", [lot.id, materialId]);
        const inspections = input.entities.filter(
          (e) => e.kind === "inspection" && e.attributes.lotId === lot.id,
        );
        if (
          lot.attributes.quality !== "released" ||
          !inspections.length ||
          inspections.some((e) => e.attributes.status !== "released")
        )
          refuse("MATERIAL_NOT_QUALITY_RELEASED", [lot.id], "blocked");
        for (const inspection of inspections) current(inspection);
        usedProducers.add(String(lot.attributes.producerId));
        if (material.attributes.producerId !== lot.attributes.producerId)
          refuse("MATERIAL_ORIGIN_CONFLICT", [lot.id]);
        const key = lotKey(lot.id, order.id),
          mine = owned.get(key) ?? 0,
          remaining = free.get(lot.id) ?? 0;
        availableForRules += mine + remaining;
        if (allocation.quantity > mine + remaining)
          refuse("MATERIAL_SHORTAGE_OR_ALREADY_RESERVED", [lot.id, order.id], "blocked");
        const fromMine = Math.min(mine, allocation.quantity);
        owned.set(key, mine - fromMine);
        free.set(lot.id, remaining - (allocation.quantity - fromMine));
        totals.set(materialId, (totals.get(materialId) ?? 0) + allocation.quantity);
      }
      for (const materialId of materialIds) {
        const required =
          Number(wo.attributes.quantity) *
          (bom.attributes.quantities as Record<string, number>)[materialId];
        if (!Number.isSafeInteger(required))
          refuse("EXPLICIT_INTEGRAL_BASE_UNIT_REQUIRED", [bom.id, materialId]);
        if ((totals.get(materialId) ?? 0) !== required)
          refuse("BOM_ALLOCATION_QUANTITY_MISMATCH", [bom.id, materialId], "blocked");
      }
      const scoped = structuredClone(action!);
      if (usedProducers.size !== 1 || !usedProducers.has(String(scoped.facts.producer?.value)))
        refuse("MULTI_OR_UNBOUND_MATERIAL_ORIGIN_RULE_METHOD", [...usedProducers]);
      // Numeric rule units cannot combine unrelated materials. Exact BOM allocation still checks every material.
      if (materialIds.length === 1)
        scoped.facts.inventoryQuantity = {
          value: availableForRules,
          unit: String(entities.get(materialIds[0])!.attributes.unit),
          basis: "record",
          evidenceIds: job.evidenceIds,
        };
      else if (
        input.constraints.some(
          (r) => r.condition.field === "inventoryQuantity" && scoped.requiredRuleIds.includes(r.id),
        )
      )
        refuse("MULTI_MATERIAL_SCALAR_RULE_REQUIRES_REVIEW", materialIds);
      const applicable = input.constraints.filter(
        (rule) =>
          scoped.requiredRuleIds.includes(rule.id) ||
          ((!rule.scope.customerId || rule.scope.customerId === scoped.customerId) &&
            (!rule.scope.productId || rule.scope.productId === scoped.productId) &&
            rule.scope.actionKinds.includes(scoped.kind)),
      );
      for (const rule of applicable) {
        if (
          (rule.scope.productId && rule.scope.productId !== scoped.productId) ||
          (rule.scope.customerId && rule.scope.customerId !== scoped.customerId) ||
          !rule.scope.actionKinds.includes(scoped.kind)
        )
          refuse("MANDATORY_RULE_SCOPE_CONFLICT", [rule.id]);
        if (rule.condition.field === "capacityMinutes") {
          if (job.steps.length !== 1 || job.steps[0].candidates.length !== 1)
            refuse("MULTI_RESOURCE_SCALAR_CAPACITY_RULE_REQUIRES_REVIEW", [rule.id]);
          const resourceId = job.steps[0].candidates[0].resourceId;
          let remainingMinutes = 0;
          for (const window of calendar(resourceId)) {
            let cursor = window.start;
            for (const busy of [...(bookings.get(resourceId) ?? [])].sort(
              (a, b) => a.start - b.start,
            )) {
              if (busy.end <= cursor || busy.start >= window.end) continue;
              remainingMinutes += Math.max(0, Math.min(busy.start, window.end) - cursor) / 60_000;
              cursor = Math.max(cursor, Math.min(busy.end, window.end));
            }
            remainingMinutes += Math.max(0, window.end - cursor) / 60_000;
          }
          scoped.facts.capacityMinutes = {
            value: remainingMinutes,
            unit: "minute",
            basis: "record",
            evidenceIds: plan.evidenceIds,
          };
        }
        const check = evaluateRule(input, scoped, rule, at);
        if (check.status !== "eligible")
          refuse(
            check.reason,
            [rule.id],
            check.status === "prohibited" ? "blocked" : "requires_review",
          );
      }
      const completed = new Map<string, number>();
      const pending = [...job.steps];
      while (pending.length) {
        const index = pending.findIndex((step) =>
          (get(step.operationId, "operation").attributes.predecessorIds as string[]).every((key) =>
            completed.has(key),
          ),
        );
        if (index < 0)
          refuse(
            "PREDECESSOR_OUTSIDE_ROUTING_OR_UNSCHEDULED",
            pending.map((s) => s.operationId),
          );
        const step = pending.splice(index, 1)[0],
          operation = current(get(step.operationId, "operation"));
        evidence(step.evidenceIds);
        for (const inspectionId of step.inspectionIds) {
          const inspection = current(get(inspectionId, "inspection"));
          if (
            inspection.attributes.status !== "released" ||
            !job.allocations.some((a) => a.lotId === inspection.attributes.lotId)
          )
            refuse("OPERATION_INSPECTION_NOT_RELEASED_OR_UNRELATED", [inspectionId], "blocked");
        }
        const predecessors = operation.attributes.predecessorIds as string[];
        const earliest = Math.max(
          horizon.start,
          ...predecessors.map((key) => completed.get(key)!),
          step.externalReadyAt ? Date.parse(step.externalReadyAt) : horizon.start,
        );
        const choices: { task: ScheduledTask; end: number }[] = [];
        const candidateIssues: PlanningIssue[] = [];
        for (const candidate of step.candidates) {
          try {
            const preferred = current(get(String(operation.attributes.resourceId), "resource"));
            if (
              get(candidate.resourceId, "resource").attributes.resourceType !==
              preferred.attributes.resourceType
            )
              refuse("CANDIDATE_RESOURCE_KIND_CONFLICT", [candidate.resourceId]);
            const resourceIds = [candidate.resourceId, ...step.toolIds, ...step.laborIds];
            if (new Set(resourceIds).size !== resourceIds.length)
              refuse("DUPLICATE_EXCLUSIVE_RESOURCE", resourceIds);
            for (const resourceId of resourceIds) {
              const resource = current(get(resourceId, "resource"));
              if (
                step.laborIds.includes(resourceId) &&
                resource.attributes.resourceType !== "labor"
              )
                refuse("LABOR_RESOURCE_KIND_REQUIRED", [resourceId]);
              if (
                !(resource.attributes.processIds as string[]).includes(
                  String(operation.attributes.processId),
                )
              )
                refuse("RESOURCE_PROCESS_NOT_SUPPORTED", [resourceId], "blocked");
              const cap = input.entities.filter(
                (e) =>
                  e.kind === "capability" &&
                  e.attributes.resourceId === resourceId &&
                  e.attributes.processId === operation.attributes.processId,
              );
              if (cap.length !== 1 || cap[0].attributes.verification !== "verified")
                refuse("RESOURCE_QUALIFICATION_MISSING", [resourceId], "requires_review");
              current(cap[0]);
              if (
                input.entities.some(
                  (e) =>
                    e.kind === "event" &&
                    e.attributes.eventType === "downtime" &&
                    Date.parse(String(e.attributes.at)) <= horizon.end &&
                    (e.attributes.subjectIds as string[]).includes(resourceId),
                )
              )
                refuse("DOWNTIME_REQUIRES_VERIFIED_RETURN_TO_SERVICE", [resourceId], "blocked");
            }
            const runMinutes = Number(wo.attributes.quantity) * candidate.minutesPerUnit;
            const duration = Math.ceil((candidate.setupMinutes + runMinutes) * 60_000);
            if (!Number.isSafeInteger(duration) || duration <= 0)
              refuse("INVALID_OPERATION_DURATION", [step.operationId]);
            const start = simultaneousSlot(resourceIds, earliest, duration);
            if (start === null) refuse("NO_SHARED_CALENDAR_CAPACITY", resourceIds, "blocked");
            const end = start + duration,
              endsAt = new Date(end).toISOString();
            for (const resourceId of resourceIds) {
              current(get(resourceId, "resource"), endsAt);
              for (const cap of input.entities.filter(
                (e) =>
                  e.kind === "capability" &&
                  e.attributes.resourceId === resourceId &&
                  e.attributes.processId === operation.attributes.processId,
              ))
                current(cap, endsAt);
            }
            for (const record of [wo, order, product, routing, bom, operation])
              current(record, endsAt);
            evidence([...job.evidenceIds, ...step.evidenceIds], endsAt);
            for (const allocation of job.allocations) {
              current(get(allocation.lotId, "lot"), endsAt);
              for (const inspection of input.entities.filter(
                (e) => e.kind === "inspection" && e.attributes.lotId === allocation.lotId,
              ))
                current(inspection, endsAt);
            }
            for (const rule of applicable) {
              const check = evaluateRule(input, scoped, rule, endsAt);
              if (check.status !== "eligible")
                refuse(
                  check.reason,
                  [rule.id],
                  check.status === "prohibited" ? "blocked" : "requires_review",
                );
            }
            choices.push({
              end,
              task: {
                workOrderId: wo.id,
                orderId: order.id,
                actionId: action!.id,
                operationId: step.operationId,
                resourceId: candidate.resourceId,
                toolIds: step.toolIds,
                laborIds: step.laborIds,
                predecessorIds: predecessors,
                startsAt: new Date(start).toISOString(),
                endsAt,
                quantity: Number(wo.attributes.quantity),
                quantityUnit: String(product.attributes.unit),
                setupMinutes: candidate.setupMinutes,
                runMinutes,
                evidenceIds: [
                  ...new Set([...job.evidenceIds, ...step.evidenceIds, ...operation.evidenceIds]),
                ],
              },
            });
          } catch (error) {
            if (!(error instanceof PlanBlocked)) throw error;
            candidateIssues.push(error.issue);
          }
        }
        choices.sort((a, b) => a.end - b.end || a.task.resourceId.localeCompare(b.task.resourceId));
        if (!choices.length)
          throw new PlanBlocked(
            candidateIssues[0] ?? {
              code: "NO_ELIGIBLE_RESOURCE",
              ids: [step.operationId],
              status: "blocked",
            },
          );
        const chosen = choices[0];
        allTasks.push(chosen.task);
        completed.set(step.operationId, chosen.end);
        for (const resourceId of [
          chosen.task.resourceId,
          ...chosen.task.toolIds,
          ...chosen.task.laborIds,
        ])
          addBooking(resourceId, { start: Date.parse(chosen.task.startsAt), end: chosen.end });
      }
      jobs.push({
        workOrderId: wo.id,
        orderId,
        status: "candidate",
        issues: [],
        dueAt,
        late: Math.max(...completed.values()) > Date.parse(dueAt),
        allocations: job.allocations,
      });
    } catch (error) {
      if (!(error instanceof PlanBlocked)) throw error;
      free = beforeFree;
      owned = beforeOwned;
      bookings.clear();
      for (const [key, value] of beforeBookings) bookings.set(key, value);
      allTasks.splice(taskCount);
      jobs.push({
        workOrderId: job.workOrderId,
        orderId,
        status: "blocked",
        issues: [error.issue],
        dueAt,
        late: null,
        allocations: [],
      });
    }
  }
  const ownerIntentAssessment = assessOwnerIntents(
    input,
    jobs.map((job) => ({
      actionId: plan.jobs.find((j) => j.workOrderId === job.workOrderId)!.actionId,
      status: job.status === "candidate" ? ("eligible" as const) : ("prohibited" as const),
    })),
    at,
  );
  return {
    algorithmVersion: "gm-operations/earliest-due-finite-v1" as const,
    origin: "synthetic" as const,
    evaluatedAt: at,
    inputDigest,
    planDigest,
    plan,
    constraintVersions: input.constraints.map((rule) => ({ id: rule.id, version: rule.version })),
    status:
      jobs.every((job) => job.status === "candidate" && !job.late) &&
      !ownerIntentAssessment.conflicts.length &&
      !ownerIntentAssessment.inferredGoalsRequireConfirmation.length &&
      ownerIntentAssessment.summaries.every(
        (intent) => intent.state === "active" || intent.state === "rejected",
      )
        ? ("candidate_feasible" as const)
        : ("blocked_or_requires_review" as const),
    jobs,
    tasks: allTasks,
    ownerIntentAssessment,
    inventoryRemaining: [...free].map(([lotId, uncommitted]) => ({
      lotId,
      unit: String(entities.get(lotId)?.attributes.unit ?? "unknown"),
      uncommitted,
      reservedForOrders: [...owned]
        .filter(([key]) => JSON.parse(key)[0] === lotId)
        .reduce((sum, [, value]) => sum + value, 0),
    })),
    approval: "required_before_assignment" as const,
    optimality: "not_claimed" as const,
    limits: [
      "One supplied snapshot/horizon, non-preemptive earliest-due heuristic; no global optimality.",
      "Explicit usable shift windows; undisclosed breaks are unknown. No assumed tool/labor availability.",
      "No automatic return-to-service. Future external readiness is a supplied commitment, not confirmed completion.",
      "Candidates are not reservations, approved schedules or machine commands. Persisted plant-wide locking is required before operational approval.",
    ],
  };
}
