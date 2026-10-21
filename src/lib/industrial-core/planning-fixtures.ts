import { fixture, REPLAY_AT, UNTIL } from "./fixtures";
import { inputSchema, type Entity } from "./model";
import { operatingPlanSchema, planOperations, type OperatingPlan } from "./planning";

export const planningScenarioIds = [
  "normal",
  "shortage",
  "breakdown",
  "quality_hold",
  "outsourced_delay",
  "calendar_unknown",
  "owner_conflict",
] as const;
export type PlanningScenario = (typeof planningScenarioIds)[number];

/** All records are invented and use the historical core clock; never refresh imported evidence. */
export function planningFixture(scenario: PlanningScenario = "normal") {
  const input = fixture("A");
  const find = (key: string) => input.entities.find((e) => e.id === key)!;
  const copy = (source: string, id: string, attributes: Record<string, unknown>) => {
    const entity: Entity = {
      ...structuredClone(find(source)),
      id,
      label: `SYNTHETIC ${id}`,
      attributes,
    };
    input.entities.push(entity);
    return entity;
  };
  find("shift").attributes.availableMinutes = 480;
  find("lot").attributes.quantity = 300;
  find("order").attributes.dueAt = "2026-10-20T17:00:00.000Z";
  copy("order", "order-second", { ...find("order").attributes, dueAt: "2026-10-20T19:00:00.000Z" });
  copy("work-order", "work-order-second", {
    ...find("work-order").attributes,
    orderId: "order-second",
  });
  for (const [key, resourceType] of [
    ["operator", "labor"],
    ["tool", "work_center"],
  ]) {
    copy("press", key, { ...find("press").attributes, resourceType });
    copy("press-capability", `${key}-qualification`, {
      resourceId: key,
      processId: "stamping",
      verification: "verified",
    });
    copy("shift", `${key}-shift`, { ...find("shift").attributes, resourceId: key });
  }
  input.actions = [
    input.actions[0],
    { ...structuredClone(input.actions[0]), id: "produce-second", label: "SYNTHETIC second order" },
  ];
  const job = (workOrderId: string, actionId: string): OperatingPlan["jobs"][number] => ({
    workOrderId,
    actionId,
    evidenceIds: ["source"],
    allocations: [{ lotId: "lot", quantity: 100, unit: "kg" }],
    steps: [
      {
        operationId: "operation",
        evidenceIds: ["source"],
        candidates: [{ resourceId: "press", setupMinutes: 10, minutesPerUnit: 1.2 }],
        toolIds: ["tool"],
        laborIds: ["operator"],
        externalReadyAt: null,
        inspectionIds: ["inspection"],
      },
    ],
  });
  const plan: OperatingPlan = {
    origin: "synthetic",
    schemaVersion: "gm-operations-plan/v1",
    id: "SYNTHETIC-two-order-plan",
    startsAt: REPLAY_AT,
    endsAt: "2026-10-20T20:00:00.000Z",
    evidenceIds: ["source"],
    jobs: [job("work-order-second", "produce-second"), job("work-order", "produce-approved")],
    unavailable: [],
  };
  if (scenario === "shortage") find("lot").attributes.quantity = 150;
  if (scenario === "breakdown")
    input.entities.push({
      ...structuredClone(find("inspection")),
      id: "press-stopped",
      kind: "event",
      attributes: { eventType: "downtime", subjectIds: ["press"], at: REPLAY_AT },
    });
  if (scenario === "quality_hold") find("inspection").attributes.status = "held";
  if (scenario === "outsourced_delay")
    plan.jobs[1].steps[0].externalReadyAt = "2026-10-20T18:00:00.000Z";
  if (scenario === "calendar_unknown") find("operator-shift").attributes.availableMinutes = 400;
  if (scenario === "owner_conflict")
    input.ownerIntents = [
      {
        id: "owner-avoid",
        ownerOrganizationId: input.organizationId,
        goal: "relationship",
        statement: "SYNTHETIC owner asks to avoid this action until a conversation",
        source: "owner_stated",
        status: "confirmed",
        confirmedBy: "SYNTHETIC-owner",
        preference: "avoid",
        relatedActionIds: ["produce-approved"],
        counterpartyId: null,
        evidenceIds: ["source"],
        effectiveFrom: REPLAY_AT,
        expiresAt: UNTIL,
      },
    ];
  input.evidence.push({
    id: "planning-source",
    title: "Invented finite-planning contract — not customer or UCI measurements",
    source: "data/industrial-core/planning-source.txt",
    digest: "53bd37a21be2a3df38dd4f4bdc6e1e2b3f285139c0aae7a6587dc617f2635480",
    observedAt: "2026-10-20T00:00:00.000Z",
    expiresAt: UNTIL,
    verification: "verified",
    origin: "synthetic",
  });
  for (const entity of input.entities) entity.evidenceIds = ["source", "planning-source"];
  plan.evidenceIds = ["source", "planning-source"];
  for (const job of plan.jobs) {
    job.evidenceIds = ["source", "planning-source"];
    for (const step of job.steps) step.evidenceIds = ["source", "planning-source"];
  }
  return { input: inputSchema.parse(input), plan: operatingPlanSchema.parse(plan) };
}
export async function runPlanningScenario(scenario: PlanningScenario) {
  const { input, plan } = planningFixture(scenario);
  return { ...(await planOperations(input, plan, REPLAY_AT)), inputSnapshot: input };
}

/** Only a newly created bundled synthetic workspace gets an explicit instantiation clock. */
export function instantiatePlanningFixture(
  scenario: PlanningScenario,
  organizationId: number,
  factoryId: number,
  at: string,
) {
  const template = planningFixture(scenario);
  const delta = Date.parse(at) - Date.parse(REPLAY_AT);
  const shiftTimes = (value: unknown): unknown => {
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value))
      return new Date(Date.parse(value) + delta).toISOString();
    if (Array.isArray(value)) return value.map(shiftTimes);
    if (value && typeof value === "object")
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, shiftTimes(item)]),
      );
    return value;
  };
  const shifted = shiftTimes(template) as typeof template;
  shifted.input.organizationId = organizationId;
  shifted.input.factoryId = factoryId;
  shifted.input.syntheticClock = { templateAsOf: REPLAY_AT, instantiatedAt: at };
  shifted.input.sourceId = `bundled-operating-plan:${scenario}`;
  for (const entity of shifted.input.entities) {
    entity.ownerOrganizationId = organizationId;
    if (entity.kind === "facility") entity.attributes.factoryRef = factoryId;
  }
  for (const rule of shifted.input.constraints) rule.ownerOrganizationId = organizationId;
  for (const intent of shifted.input.ownerIntents ?? [])
    intent.ownerOrganizationId = organizationId;
  // Leave time for independent review; this never moves a saved/imported plan's timestamps.
  shifted.plan.startsAt = new Date(Date.parse(at) + 5 * 60_000).toISOString();
  return { input: inputSchema.parse(shifted.input), plan: operatingPlanSchema.parse(shifted.plan) };
}
