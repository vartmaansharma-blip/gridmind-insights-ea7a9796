import { z } from "zod";
import { inputSchema, id, type CoreInput, type Entity } from "../industrial-core/model";
import {
  physicalFixture,
  evaluatePhysicalSnapshot,
  type PhysicalSnapshot,
} from "../industrial-core/physical";
import { planningFixture } from "../industrial-core/planning-fixtures";
import {
  planOperations,
  type OperatingPlan,
  type PlanningResult,
} from "../industrial-core/planning";
import { digest } from "../industrial-core/engine";
import { REPLAY_AT } from "../industrial-core/fixtures";

const text = z.string().trim().min(1).max(100);
const key = id.regex(
  /^[a-zA-Z][a-zA-Z0-9-]*$/,
  "Use letters, numbers and hyphens; start with a letter.",
);
const amount = z.number().int().positive().max(1000);
export const sections = [
  "Overview",
  "Organization & People",
  "Factories & Infrastructure",
  "Machines & Resources",
  "Production & Materials",
  "Investigations",
  "Decisions",
  "Reports & History",
] as const;
export const incidentKinds = [
  "machine_stop",
  "material_shortage",
  "quality_hold",
  "electrical_uncertainty",
  "infeasible_alternative",
  "owner_conflict",
] as const;
export type IncidentKind = (typeof incidentKinds)[number];
export type SampleEvaluation = {
  revision: number;
  sourceDigest: string;
  input: CoreInput;
  specification: OperatingPlan;
  plan: PlanningResult;
  physical: ReturnType<typeof evaluatePhysicalSnapshot>;
  alternatives: { resourceId: string; eligible: boolean; reasons: string[] }[];
  eligible: boolean;
  uncertainty: string[];
};
export type SampleCase = {
  id: string;
  title: string;
  kind: IncidentKind;
  subjectId: string;
  orderIds: string[];
  evidenceIds: string[];
  observation: string;
  hypothesis: string;
  unresolved: string;
  evaluations: SampleEvaluation[];
  reviews: {
    revision: number;
    sourceDigest: string;
    decision: "defer" | "approve_for_simulation" | "reject";
    note: string;
    persona: "Demo Operations Manager";
    realAuthorization: false;
  }[];
  outcome: { kind: "simulated" | "unresolved"; note: string } | null;
};
export type SampleWorkspace = {
  schemaVersion: "gm-explore/v1";
  origin: "synthetic";
  revision: number;
  sourceRevision: number;
  profile: {
    organization: string;
    factory: string;
    country: string;
    location: string;
    industry: string;
  };
  persona: {
    id: "sample-manager";
    name: "Demo Operations Manager";
    organizationId: number;
    factoryId: number;
    realAuthorization: false;
  };
  core: CoreInput;
  physical: PhysicalSnapshot;
  cases: SampleCase[];
  timeline: { revision: number; at: string; action: string; recordIds: string[]; detail: string }[];
};
export const sampleCommandSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("profile"),
      organization: text,
      factory: text,
      country: text,
      location: text,
    })
    .strict(),
  z
    .object({
      type: z.literal("machine"),
      id: key,
      label: text,
      lineId: id,
      processId: id,
      editing: z.boolean(),
    })
    .strict(),
  z.object({ type: z.literal("remove_machine"), id }).strict(),
  z.object({ type: z.literal("availability"), id, available: z.boolean() }).strict(),
  z
    .object({
      type: z.literal("product"),
      id: key,
      label: text,
      materialId: id,
      processId: id,
      perPart: amount,
    })
    .strict(),
  z.object({ type: z.literal("lot"), id: key, materialId: id, quantity: amount }).strict(),
  z
    .object({ type: z.literal("stock"), id, quantity: z.number().int().nonnegative().max(10000) })
    .strict(),
  z
    .object({
      type: z.literal("order"),
      id: key,
      productId: id,
      machineId: id,
      lotId: id,
      quantity: amount,
    })
    .strict(),
  z.object({ type: z.literal("reserve"), lotId: id, orderId: id, quantity: amount }).strict(),
  z
    .object({
      type: z.literal("incident"),
      kind: z.enum(incidentKinds),
      subjectId: id,
      title: text,
    })
    .strict(),
  z.object({ type: z.literal("evaluate"), caseId: id }).strict(),
  z
    .object({
      type: z.literal("review"),
      caseId: id,
      decision: z.enum(["defer", "approve_for_simulation", "reject"]),
      note: text,
    })
    .strict(),
  z
    .object({
      type: z.literal("outcome"),
      caseId: id,
      kind: z.enum(["simulated", "unresolved"]),
      note: text,
    })
    .strict(),
]);
export type SampleCommand = z.infer<typeof sampleCommandSchema>;
export const records = (s: SampleWorkspace, kind: Entity["kind"]) =>
  s.core.entities.filter((e) => e.kind === kind);
export const entity = (s: SampleWorkspace, key: string, kind?: Entity["kind"]) => {
  const e = s.core.entities.find((e) => e.id === key && (!kind || e.kind === kind));
  if (!e) throw new Error(`Record ${key} is missing or has the wrong type.`);
  return e;
};
function add(
  s: SampleWorkspace,
  key: string,
  kind: Entity["kind"],
  attributes: Record<string, unknown>,
  label = key,
) {
  if (s.core.entities.some((e) => e.id === key))
    throw new Error(`Identifier ${key} already exists.`);
  const template = s.core.entities[0];
  s.core.entities.push({
    ...structuredClone(template),
    id: key,
    label,
    kind,
    attributes,
    version: 1,
    evidenceIds: ["source"],
  });
}
export function createSampleWorkspace(): SampleWorkspace {
  const { core, snapshot } = physicalFixture("normal");
  const s: SampleWorkspace = {
    schemaVersion: "gm-explore/v1",
    origin: "synthetic",
    revision: 0,
    sourceRevision: 0,
    profile: {
      organization: "GridMind Example Components",
      factory: "Example Components Plant 01",
      country: "India",
      location: "Fictional industrial estate",
      industry: "Automotive components",
    },
    persona: {
      id: "sample-manager",
      name: "Demo Operations Manager",
      organizationId: core.organizationId,
      factoryId: core.factoryId,
      realAuthorization: false,
    },
    core,
    physical: snapshot,
    cases: [],
    timeline: [
      {
        revision: 0,
        at: REPLAY_AT,
        action: "initialized",
        recordIds: ["seller", "plant"],
        detail:
          "SYNTHETIC two-press organization initialized. No real accounts or factory records.",
      },
    ],
  };
  entity(s, "seller").attributes.legalName = s.profile.organization;
  entity(s, "seller").label = s.profile.organization;
  entity(s, "plant").label = s.profile.factory;
  entity(s, "press").label = "Press 01";
  entity(s, "press-second").label = "Press 02";
  entity(s, "part").label = "Stamped bracket";
  entity(s, "second-part").label = "Formed mounting plate";
  entity(s, "lot").attributes.quantity = 300;
  for (const e of core.entities.filter((e) => e.kind === "shift"))
    e.attributes.availableMinutes = 480;
  for (const e of planningFixture().input.entities.filter((e) =>
    [
      "operator",
      "tool",
      "operator-qualification",
      "tool-qualification",
      "operator-shift",
      "tool-shift",
    ].includes(e.id),
  )) {
    const copy = structuredClone(e);
    copy.evidenceIds = ["source"];
    core.entities.push(copy);
  }
  // One shared operator/tool with explicit qualifications for both sample processes.
  for (const resourceId of ["operator", "tool"]) {
    entity(s, resourceId).attributes.processIds = ["stamping", "second-process"];
    add(s, `${resourceId}-second-qualification`, "capability", {
      resourceId,
      processId: "second-process",
      verification: "verified",
    });
  }
  add(
    s,
    "second-lot",
    "lot",
    {
      materialId: "second-material",
      producerId: "approved-producer",
      quantity: 200,
      reserved: 0,
      unit: "kg",
      quality: "released",
    },
    "Plate steel lot",
  );
  add(s, "second-inspection", "inspection", {
    lotId: "second-lot",
    status: "released",
    inspectorRef: "SYNTHETIC-inspector",
  });
  core.constraints = core.constraints.filter((r) => !["material", "capacity"].includes(r.id));
  // Actual quantities/capacity come from the finite planner, not the fixture's scalar assertions.
  core.actions = [];
  for (const wo of records(s, "work_order")) attachAction(s, wo);
  core.evidence.push({
    id: "sample-template",
    title: "SYNTHETIC connected organization initialization recipe",
    source: "data/industrial-core/sample-organization-source.txt",
    digest: "d4117929e44b1e85b069897d12d407cf0e62fc4d7ca445ccca48f5eb1d7cf5e8",
    observedAt: core.evidence[0].observedAt,
    expiresAt: core.validUntil,
    verification: "verified",
    origin: "synthetic",
  });
  for (const e of core.entities) e.evidenceIds = ["source", "sample-template"];
  for (const n of snapshot.nodes) n.evidenceIds = ["source", "sample-template"];
  for (const l of snapshot.links) l.evidenceIds = ["source", "sample-template"];
  return validateSample(s);
}
function attachAction(s: SampleWorkspace, wo: Entity) {
  const order = entity(s, String(wo.attributes.orderId), "order");
  const template = planningFixture().input.actions[0];
  const action = {
    ...structuredClone(template),
    id: `action-${wo.id}`,
    label: `Plan ${order.id}`,
    productId: String(order.attributes.productId),
    operationIds: entity(s, String(wo.attributes.routingId)).attributes.operationIds as string[],
    requiredRuleIds: s.core.constraints.map((r) => r.id),
  };
  for (const r of s.core.constraints) r.scope.productId = null;
  s.core.actions.push(action);
}
export function validateSample(s: SampleWorkspace): SampleWorkspace {
  s.core = inputSchema.parse(s.core);
  if (
    s.persona.organizationId !== s.core.organizationId ||
    s.persona.factoryId !== s.core.factoryId ||
    s.persona.realAuthorization !== false
  )
    throw new Error("Sample persona scope mismatch.");
  evaluatePhysicalSnapshot(s.core, { ...s.physical, incident: null }, REPLAY_AT);
  for (const c of s.cases) {
    entity(s, c.subjectId);
    c.orderIds.forEach((id) => entity(s, id, "order"));
    if (c.evidenceIds.some((id) => !s.core.evidence.some((e) => e.id === id)))
      throw new Error("Investigation evidence missing.");
  }
  return s;
}
export function linkedOrders(s: SampleWorkspace, subjectId: string): string[] {
  const subject = entity(s, subjectId);
  return records(s, "work_order")
    .filter((wo) => {
      const order = entity(s, String(wo.attributes.orderId));
      if (subject.kind === "order") return order.id === subjectId;
      const routing = entity(s, String(wo.attributes.routingId));
      if (subject.kind === "resource")
        return (routing.attributes.operationIds as string[]).some(
          (id) => entity(s, id).attributes.resourceId === subjectId,
        );
      const material = subject.kind === "lot" ? subject.attributes.materialId : subjectId;
      // A lot hold/shortage affects its selected allocations, not every order sharing its material type.
      if (subject.kind === "lot" && orderLot(s, wo.id, String(material)) !== subject.id)
        return false;
      return records(s, "bom").some(
        (b) =>
          b.attributes.productId === order.attributes.productId &&
          (b.attributes.materialIds as string[]).includes(String(material)),
      );
    })
    .map((wo) => String(wo.attributes.orderId));
}
export function machineStopped(s: SampleWorkspace, machineId: string) {
  return records(s, "event").some(
    (e) =>
      e.attributes.eventType === "downtime" &&
      (e.attributes.subjectIds as string[]).includes(machineId),
  );
}
export function planningSpec(s: SampleWorkspace): OperatingPlan {
  return {
    origin: "synthetic",
    schemaVersion: "gm-operations-plan/v1",
    id: "sample-organization-plan",
    startsAt: REPLAY_AT,
    endsAt: "2026-10-20T20:00:00.000Z",
    evidenceIds: ["source"],
    unavailable: [],
    jobs: records(s, "work_order").map((wo) => {
      const order = entity(s, String(wo.attributes.orderId)),
        routing = entity(s, String(wo.attributes.routingId));
      const bom = records(s, "bom").find(
        (b) => b.attributes.productId === order.attributes.productId,
      )!;
      return {
        workOrderId: wo.id,
        actionId: `action-${wo.id}`,
        evidenceIds: wo.evidenceIds,
        allocations: (bom.attributes.materialIds as string[]).map((materialId) => {
          const lot = records(s, "lot").find(
            (l) =>
              l.attributes.materialId === materialId && l.id === orderLot(s, wo.id, materialId),
          );
          if (!lot) throw new Error(`Select a matching material lot for ${wo.id}.`);
          return {
            lotId: lot.id,
            quantity:
              Number(wo.attributes.quantity) *
              (bom.attributes.quantities as Record<string, number>)[materialId],
            unit: String(lot.attributes.unit),
          };
        }),
        steps: (routing.attributes.operationIds as string[]).map((id) => ({
          operationId: id,
          evidenceIds: ["source"],
          candidates: [
            {
              resourceId: String(entity(s, id).attributes.resourceId),
              setupMinutes: 10,
              minutesPerUnit: 1.2,
            },
          ],
          toolIds: ["tool"],
          laborIds: ["operator"],
          externalReadyAt: null,
          inspectionIds: [],
        })),
      };
    }),
  };
}
// requires edges retain chosen lot per work order, using the existing core relationship model.
function orderLot(s: SampleWorkspace, woId: string, materialId: string) {
  return (
    s.core.relationships.find(
      (e) =>
        e.from === woId &&
        e.type === "consumes" &&
        entity(s, e.to).attributes.materialId === materialId,
    )?.to ?? records(s, "lot").find((l) => l.attributes.materialId === materialId)?.id
  );
}
export async function sampleSourceDigest(s: SampleWorkspace) {
  return digest({ core: s.core, physical: s.physical, profile: s.profile });
}
export async function samplePlan(s: SampleWorkspace) {
  return planOperations(s.core, planningSpec(s), REPLAY_AT);
}
export function latestDecision(s: SampleWorkspace, c: SampleCase) {
  const evaluation = c.evaluations.at(-1),
    review = c.reviews.at(-1);
  const stale = !!evaluation && evaluation.revision !== s.sourceRevision;
  return {
    evaluation,
    review,
    stale,
    status: stale
      ? "stale — reevaluate"
      : (review?.decision ?? (evaluation ? "awaiting simulated review" : "not evaluated")),
  };
}
export async function applySampleCommand(
  previous: SampleWorkspace,
  raw: unknown,
): Promise<SampleWorkspace> {
  const cmd = sampleCommandSchema.parse(raw),
    s = structuredClone(previous);
  if (s.revision >= 80)
    throw new Error(
      "This bounded session has reached 80 changes. Export your synthetic report, then reset.",
    );
  const sourceChange = !["evaluate", "review", "outcome"].includes(cmd.type);
  const changes: string[] = [];
  const findCase = (key: string) => {
    const c = s.cases.find((c) => c.id === key);
    if (!c) throw new Error("Investigation not found.");
    return c;
  };
  if (cmd.type === "profile") {
    s.profile = {
      ...s.profile,
      organization: cmd.organization,
      factory: cmd.factory,
      country: cmd.country,
      location: cmd.location,
    };
    entity(s, "seller").attributes.legalName = cmd.organization;
    entity(s, "seller").label = cmd.organization;
    entity(s, "plant").label = cmd.factory;
  } else if (cmd.type === "machine") {
    const line = entity(s, cmd.lineId, "resource");
    entity(s, cmd.processId, "process");
    if (
      line.attributes.resourceType !== "line" ||
      !(line.attributes.processIds as string[]).includes(cmd.processId)
    )
      throw new Error("The line does not support this process.");
    if (cmd.editing) {
      const machine = entity(s, cmd.id, "resource");
      if (machine.attributes.resourceType !== "machine")
        throw new Error("Only a machine can be edited here.");
      const related = records(s, "operation").filter((op) => op.attributes.resourceId === cmd.id);
      if (related.some((op) => op.attributes.processId !== cmd.processId))
        throw new Error(
          "This capability is required by connected work orders. Resolve those routes first.",
        );
      machine.label = cmd.label;
      machine.attributes.processIds = [cmd.processId];
      machine.version++;
      s.core.entities = s.core.entities.filter(
        (e) => !(e.kind === "capability" && e.attributes.resourceId === cmd.id),
      );
      const node = s.physical.nodes.find((n) => n.coreResourceId === cmd.id)!;
      node.label = cmd.label;
      s.physical.links = s.physical.links.filter(
        (l) => !(l.from === node.id && l.kind === "line_membership"),
      );
    } else {
      add(
        s,
        cmd.id,
        "resource",
        {
          resourceType: "machine",
          facilityId: "plant",
          assetRef: null,
          processIds: [cmd.processId],
        },
        cmd.label,
      );
      add(s, `shift-${cmd.id}`, "shift", {
        resourceId: cmd.id,
        facilityId: "plant",
        startsAt: REPLAY_AT,
        endsAt: "2026-10-20T20:00:00.000Z",
        availableMinutes: 480,
      });
      s.physical.nodes.push({
        id: `node-${cmd.id}`,
        kind: "machine",
        label: cmd.label,
        coreResourceId: cmd.id,
        model: "Fictional user-defined press",
        evidenceIds: ["source"],
        verification: "verified",
      });
      s.physical.links.push({
        id: `feed-${cmd.id}`,
        from: "panel",
        to: `node-${cmd.id}`,
        kind: "power_feed",
        evidenceIds: ["source"],
        verification: "verified",
      });
    }
    add(s, `qualification-${cmd.id}`, "capability", {
      resourceId: cmd.id,
      processId: cmd.processId,
      verification: "verified",
    });
    const node = s.physical.nodes.find((n) => n.coreResourceId === cmd.id)!,
      lineNode = s.physical.nodes.find((n) => n.coreResourceId === cmd.lineId)!;
    s.physical.links.push({
      id: `line-${cmd.id}`,
      from: node.id,
      to: lineNode.id,
      kind: "line_membership",
      evidenceIds: ["source"],
      verification: "verified",
    });
    changes.push(cmd.id);
  } else if (cmd.type === "remove_machine") {
    entity(s, cmd.id, "resource");
    if (
      records(s, "operation").some((op) => op.attributes.resourceId === cmd.id) ||
      s.cases.some((c) => c.subjectId === cmd.id) ||
      records(s, "event").some((e) => (e.attributes.subjectIds as string[]).includes(cmd.id))
    )
      throw new Error(
        "Machine is referenced by work orders or incident history. Resolve the dependencies first.",
      );
    const node = s.physical.nodes.find((n) => n.coreResourceId === cmd.id);
    if (!node) throw new Error("Machine topology missing.");
    s.core.entities = s.core.entities.filter(
      (e) =>
        e.id !== cmd.id &&
        !(["capability", "shift"].includes(e.kind) && e.attributes.resourceId === cmd.id),
    );
    s.physical.nodes = s.physical.nodes.filter((n) => n.id !== node.id);
    s.physical.links = s.physical.links.filter((l) => l.from !== node.id && l.to !== node.id);
    changes.push(cmd.id);
  } else if (cmd.type === "availability") {
    const m = entity(s, cmd.id, "resource");
    if (m.attributes.resourceType !== "machine") throw new Error("Choose a machine.");
    if (cmd.available) {
      s.core.entities = s.core.entities.filter(
        (e) =>
          !(
            e.kind === "event" &&
            e.id.startsWith("sample-stop-") &&
            (e.attributes.subjectIds as string[]).includes(cmd.id)
          ),
      );
    } else if (!machineStopped(s, cmd.id))
      add(
        s,
        `sample-stop-${s.revision + 1}`,
        "event",
        { eventType: "downtime", subjectIds: [cmd.id], at: REPLAY_AT },
        "Simulated machine unavailable",
      );
    changes.push(cmd.id);
  } else if (cmd.type === "product") {
    entity(s, cmd.materialId, "material");
    const process = entity(s, cmd.processId, "process");
    if (!(process.attributes.inputIds as string[]).includes(cmd.materialId))
      throw new Error("Material does not match this process.");
    add(s, cmd.id, "product", { revision: "R2", specificationId: "spec", unit: "part" }, cmd.label);
    add(s, `bom-${cmd.id}`, "bom", {
      productId: cmd.id,
      revision: "R2",
      materialIds: [cmd.materialId],
      quantities: { [cmd.materialId]: cmd.perPart },
      quantityUnits: { [cmd.materialId]: "kg" },
    });
    process.attributes.outputIds = [...(process.attributes.outputIds as string[]), cmd.id];
    // Product/process relationship is explicit, separate from a machine-specific routing.
    s.core.relationships.push({
      id: `process-${cmd.id}`,
      from: cmd.id,
      to: cmd.processId,
      type: "requires",
      evidenceIds: ["source"],
    });
    changes.push(cmd.id);
  } else if (cmd.type === "lot") {
    const material = entity(s, cmd.materialId, "material");
    add(
      s,
      cmd.id,
      "lot",
      {
        materialId: material.id,
        producerId: material.attributes.producerId,
        quantity: cmd.quantity,
        reserved: 0,
        unit: material.attributes.unit,
        quality: "released",
      },
      `Sample ${cmd.id}`,
    );
    add(s, `inspection-${cmd.id}`, "inspection", {
      lotId: cmd.id,
      status: "released",
      inspectorRef: "SYNTHETIC-sample-review",
    });
    changes.push(cmd.id);
  } else if (cmd.type === "stock") {
    const lot = entity(s, cmd.id, "lot");
    if (cmd.quantity < Number(lot.attributes.reserved))
      throw new Error("Quantity cannot be below protected reservations.");
    lot.attributes.quantity = cmd.quantity;
    lot.version++;
    changes.push(cmd.id);
  } else if (cmd.type === "order") {
    const product = entity(s, cmd.productId, "product"),
      machine = entity(s, cmd.machineId, "resource"),
      lot = entity(s, cmd.lotId, "lot");
    const bom = records(s, "bom").find((b) => b.attributes.productId === product.id)!;
    const processId = productProcess(s, product.id);
    if (
      machine.attributes.resourceType !== "machine" ||
      !(machine.attributes.processIds as string[]).includes(processId)
    )
      throw new Error("Machine is incompatible with the product's process.");
    if (!(bom.attributes.materialIds as string[]).includes(String(lot.attributes.materialId)))
      throw new Error("Lot material does not match the product BOM.");
    add(
      s,
      cmd.id,
      "order",
      {
        customerId: "buyer",
        productId: product.id,
        revision: product.attributes.revision,
        quantity: cmd.quantity,
        dueAt: s.core.validUntil,
      },
      `Sample ${cmd.id}`,
    );
    add(s, `op-${cmd.id}`, "operation", { processId, resourceId: machine.id, predecessorIds: [] });
    add(s, `routing-${cmd.id}`, "routing", {
      productId: product.id,
      revision: product.attributes.revision,
      operationIds: [`op-${cmd.id}`],
    });
    add(s, `work-${cmd.id}`, "work_order", {
      orderId: cmd.id,
      routingId: `routing-${cmd.id}`,
      quantity: cmd.quantity,
    });
    attachAction(s, entity(s, `work-${cmd.id}`));
    s.core.relationships.push({
      id: `lot-${cmd.id}`,
      from: `work-${cmd.id}`,
      to: lot.id,
      type: "consumes",
      evidenceIds: ["source"],
    });
    changes.push(cmd.id, machine.id, lot.id);
  } else if (cmd.type === "reserve") {
    const lot = entity(s, cmd.lotId, "lot");
    entity(s, cmd.orderId, "order");
    const wo = records(s, "work_order").find((w) => w.attributes.orderId === cmd.orderId)!;
    const bom = records(s, "bom").find(
      (b) =>
        b.attributes.productId === entity(s, String(wo.attributes.orderId)).attributes.productId,
    )!;
    if (
      !(bom.attributes.materialIds as string[]).includes(String(lot.attributes.materialId)) ||
      orderLot(s, wo.id, String(lot.attributes.materialId)) !== lot.id
    )
      throw new Error("Reservation must match this order's selected material lot.");
    const already = records(s, "reservation")
      .filter((r) => r.attributes.orderId === cmd.orderId && r.attributes.lotId === lot.id)
      .reduce((sum, r) => sum + Number(r.attributes.quantity), 0);
    if (
      already + cmd.quantity >
      Number(wo.attributes.quantity) *
        (bom.attributes.quantities as Record<string, number>)[String(lot.attributes.materialId)]
    )
      throw new Error("Reservation exceeds this work order's material requirement.");
    if (Number(lot.attributes.quantity) - Number(lot.attributes.reserved) < cmd.quantity)
      throw new Error("Insufficient unreserved stock.");
    add(s, `reserve-${s.revision + 1}`, "reservation", {
      lotId: lot.id,
      orderId: cmd.orderId,
      quantity: cmd.quantity,
      unit: lot.attributes.unit,
    });
    lot.attributes.reserved = Number(lot.attributes.reserved) + cmd.quantity;
    changes.push(lot.id, cmd.orderId);
  } else if (cmd.type === "incident") {
    const subject = entity(s, cmd.subjectId);
    if (
      cmd.kind === "machine_stop" &&
      (subject.kind !== "resource" || subject.attributes.resourceType !== "machine")
    )
      throw new Error("Choose a registered machine.");
    if (["material_shortage", "quality_hold"].includes(cmd.kind) && subject.kind !== "lot")
      throw new Error("Choose a material lot.");
    if (["owner_conflict", "infeasible_alternative"].includes(cmd.kind) && subject.kind !== "order")
      throw new Error("Choose an order.");
    if (cmd.kind === "electrical_uncertainty" && subject.id !== "plant")
      throw new Error("Electrical uncertainty is scoped to this sample plant.");
    const caseId = `case-${s.revision + 1}`,
      evidenceId = `evidence-${caseId}`;
    s.core.evidence.push({
      id: evidenceId,
      title: `SYNTHETIC ${cmd.title}`,
      source: `in-memory/${caseId}`,
      digest: await digest(cmd),
      observedAt: REPLAY_AT,
      expiresAt: s.core.validUntil,
      verification: "verified",
      origin: "synthetic",
    });
    if (cmd.kind === "machine_stop")
      add(s, `sample-stop-${s.revision + 1}`, "event", {
        eventType: "downtime",
        subjectIds: [subject.id],
        at: REPLAY_AT,
      });
    if (cmd.kind === "quality_hold") {
      subject.attributes.quality = "held";
      for (const e of records(s, "inspection").filter((i) => i.attributes.lotId === subject.id))
        e.attributes.status = "held";
    }
    if (cmd.kind === "material_shortage")
      subject.attributes.quantity = Number(subject.attributes.reserved);
    const orders =
      cmd.kind === "electrical_uncertainty"
        ? records(s, "order").map((o) => o.id)
        : linkedOrders(s, subject.id);
    if (cmd.kind === "owner_conflict")
      s.core.ownerIntents = [
        ...(s.core.ownerIntents ?? []),
        {
          id: `intent-${caseId}`,
          ownerOrganizationId: s.core.organizationId,
          goal: "relationship",
          statement: "Fictional owner asks to hold this order for review",
          source: "owner_stated",
          status: "confirmed",
          confirmedBy: "SYNTHETIC-owner",
          preference: "avoid",
          relatedActionIds: records(s, "work_order")
            .filter((w) => w.attributes.orderId === subject.id)
            .map((w) => `action-${w.id}`),
          counterpartyId: "buyer",
          evidenceIds: [evidenceId],
          effectiveFrom: REPLAY_AT,
          expiresAt: s.core.validUntil,
        },
      ];
    s.cases.push({
      id: caseId,
      title: cmd.title,
      kind: cmd.kind,
      subjectId: subject.id,
      orderIds: orders,
      evidenceIds: [evidenceId],
      observation:
        cmd.kind === "electrical_uncertainty"
          ? "Fictional panel warning reported; downstream exposure is uncertain."
          : `Fictional ${cmd.kind.replaceAll("_", " ")} recorded for ${subject.label}.`,
      hypothesis: "Cause is unconfirmed. This sample does not diagnose physical equipment.",
      unresolved:
        "Real measurements, competent independent review and real authorization are absent.",
      evaluations: [],
      reviews: [],
      outcome: null,
    });
    changes.push(caseId, subject.id, ...orders);
  } else if (cmd.type === "evaluate") {
    const c = findCase(cmd.caseId),
      spec = planningSpec(s),
      physical = { ...structuredClone(s.physical), incident: null } as PhysicalSnapshot;
    if (c.kind === "electrical_uncertainty")
      physical.incident = {
        id: c.id,
        subjectNodeId: "panel",
        type: "suspected_power_fault",
        at: REPLAY_AT,
        evidenceIds: c.evidenceIds,
        observation: "hypothesis",
      };
    if (c.kind === "machine_stop")
      physical.incident = {
        id: c.id,
        subjectNodeId: s.physical.nodes.find((n) => n.coreResourceId === c.subjectId)!.id,
        type: "machine_stop",
        at: REPLAY_AT,
        evidenceIds: c.evidenceIds,
        observation: "verified",
      };
    // The core already carries the stoppage, so physical evaluation must not add its duplicate.
    const physicalInput = structuredClone(s.core);
    const physicalResult = evaluatePhysicalSnapshot(physicalInput, physical, REPLAY_AT);
    const plan = await samplePlan(s),
      order = c.orderIds[0],
      wo = records(s, "work_order").find((w) => w.attributes.orderId === order);
    const alternatives: SampleEvaluation["alternatives"] = [];
    if (wo) {
      const job = spec.jobs.find((j) => j.workOrderId === wo.id)!;
      const operation = entity(s, job.steps[0].operationId);
      for (const machine of records(s, "resource").filter(
        (m) =>
          m.attributes.resourceType === "machine" &&
          (m.attributes.processIds as string[]).includes(String(operation.attributes.processId)),
      )) {
        const candidate = structuredClone(spec);
        candidate.jobs.find((j) => j.workOrderId === wo.id)!.steps[0].candidates[0].resourceId =
          machine.id;
        const tested = await planOperations(s.core, candidate, REPLAY_AT),
          result = tested.jobs.find((j) => j.workOrderId === wo.id)!;
        alternatives.push({
          resourceId: machine.id,
          eligible:
            result.status === "candidate" && !result.late && tested.status === "candidate_feasible",
          reasons: result.issues.map((i) => i.code),
        });
      }
    }
    const uncertainty =
      c.kind === "electrical_uncertainty"
        ? ["Electrical cause and actual machine availability require confirmation."]
        : [];
    c.evaluations.push({
      revision: s.sourceRevision,
      sourceDigest: await sampleSourceDigest(s),
      input: structuredClone(s.core),
      specification: spec,
      plan,
      physical: physicalResult,
      alternatives,
      eligible: uncertainty.length === 0 && alternatives.some((a) => a.eligible),
      uncertainty,
    });
    changes.push(c.id);
  } else if (cmd.type === "review") {
    const c = findCase(cmd.caseId),
      decision = latestDecision(s, c);
    if (
      !decision.evaluation ||
      decision.stale ||
      decision.evaluation.sourceDigest !== (await sampleSourceDigest(s))
    )
      throw new Error("Evaluate the current records before simulated review.");
    if (cmd.decision === "approve_for_simulation" && !decision.evaluation.eligible)
      throw new Error("No eligible alternative exists; defer or reject instead.");
    c.reviews.push({
      revision: s.sourceRevision,
      sourceDigest: decision.evaluation.sourceDigest,
      decision: cmd.decision,
      note: cmd.note,
      persona: "Demo Operations Manager",
      realAuthorization: false,
    });
    c.outcome = null;
    changes.push(c.id);
  } else if (cmd.type === "outcome") {
    const c = findCase(cmd.caseId),
      d = latestDecision(s, c);
    if (!d.review || d.stale || d.review.sourceDigest !== d.evaluation?.sourceDigest)
      throw new Error("A current simulated review is required before recording an outcome.");
    c.outcome = { kind: cmd.kind, note: cmd.note };
    changes.push(c.id);
  }
  if (sourceChange) {
    const evidenceId = `sample-source-${s.revision + 1}`;
    s.core.evidence.push({
      id: evidenceId,
      title: `SYNTHETIC ${cmd.type} command at revision ${s.revision + 1}`,
      source: `in-memory/commands/${s.revision + 1}`,
      digest: await digest({ command: cmd, previousSource: await sampleSourceDigest(previous) }),
      observedAt: REPLAY_AT,
      expiresAt: s.core.validUntil,
      verification: "verified",
      origin: "synthetic",
    });
    for (const e of s.core.entities) {
      const old = previous.core.entities.find((o) => o.id === e.id);
      if (!old || JSON.stringify(old) !== JSON.stringify(e))
        e.evidenceIds = ["source", "sample-template", evidenceId];
    }
    for (const n of s.physical.nodes) {
      const old = previous.physical.nodes.find((o) => o.id === n.id);
      if (!old || JSON.stringify(old) !== JSON.stringify(n))
        n.evidenceIds = ["source", "sample-template", evidenceId];
    }
    for (const l of s.physical.links) {
      const old = previous.physical.links.find((o) => o.id === l.id);
      if (!old || JSON.stringify(old) !== JSON.stringify(l))
        l.evidenceIds = ["source", "sample-template", evidenceId];
    }
  }
  s.revision++;
  if (sourceChange) {
    for (const c of s.cases)
      c.orderIds =
        c.kind === "electrical_uncertainty"
          ? records(s, "order").map((o) => o.id)
          : linkedOrders(s, c.subjectId);
    s.sourceRevision++;
    for (const c of s.cases) c.outcome = null;
  }
  s.timeline.push({
    revision: s.revision,
    at: REPLAY_AT,
    action: cmd.type,
    recordIds: changes,
    detail: `SYNTHETIC ${cmd.type} — session revision ${s.revision}; fixed historical replay clock`,
  });
  return validateSample(s);
}
export function productProcess(s: SampleWorkspace, productId: string): string {
  const edge = s.core.relationships.find(
    (e) => e.from === productId && e.type === "requires" && entity(s, e.to).kind === "process",
  );
  if (edge) return edge.to;
  const routing = records(s, "routing").find((r) => r.attributes.productId === productId);
  if (!routing) throw new Error("Product process is missing.");
  return String(entity(s, (routing.attributes.operationIds as string[])[0]).attributes.processId);
}
export async function exportSample(s: SampleWorkspace) {
  return {
    classification: "SYNTHETIC",
    schemaVersion: s.schemaVersion,
    realAuthorization: false,
    actualObservedData: false,
    verifiedSavings: null,
    sourceDigest: await sampleSourceDigest(s),
    workspace: structuredClone(s),
  };
}
