import { z } from "zod";
import { evaluate, evidenceReady } from "./engine";
import { id, instant, inputSchema, type CoreInput } from "./model";
import { fixture, REPLAY_AT } from "./fixtures";

/**
 * Bounded, source-backed physical dependency slice over the EXISTING core.
 * It never certifies an electrical cause or operates equipment.
 * Fictional samples only; no customer ingestion or OT connection.
 */
const nodeSchema = z.object({
  id,
  label: z.string().min(1).max(150),
  kind: z.enum(["supply", "transformer", "panel", "meter", "machine", "line"]),
  coreResourceId: id.nullable(),
  model: z.string().min(1).max(150).nullable(),
  evidenceIds: z.array(id).min(1).max(10),
  verification: z.enum(["verified", "proposed"]),
}).strict();
const linkSchema = z.object({
  id,
  from: id,
  to: id,
  kind: z.enum(["power_feed", "line_membership"]),
  evidenceIds: z.array(id).min(1).max(10),
  verification: z.enum(["verified", "proposed"]),
}).strict();
const incidentSchema = z.object({
  id,
  subjectNodeId: id,
  type: z.enum(["machine_stop", "power_interruption", "suspected_power_fault"]),
  at: instant,
  evidenceIds: z.array(id).min(1).max(10),
  observation: z.enum(["verified", "reported", "hypothesis"]),
}).strict();
export const physicalSnapshotSchema = z.object({
  schemaVersion: z.literal("gm-physical-001/v1"),
  origin: z.literal("synthetic"),
  organizationId: z.number().int().positive(),
  factoryId: z.number().int().positive(),
  asOf: instant,
  validUntil: instant,
  nodes: z.array(nodeSchema).min(2).max(60),
  links: z.array(linkSchema).max(100),
  incident: incidentSchema.nullable(),
}).strict();
export type PhysicalSnapshot = z.infer<typeof physicalSnapshotSchema>;

function inspect(core: CoreInput, snapshot: PhysicalSnapshot, at: string) {
  if (snapshot.organizationId !== core.organizationId || snapshot.factoryId !== core.factoryId)
    throw new Error("PHYSICAL_TENANT_SCOPE_MISMATCH");
  if (
    Date.parse(snapshot.asOf) > Date.parse(at) ||
    Date.parse(snapshot.validUntil) <= Date.parse(at) ||
    Date.parse(snapshot.validUntil) <= Date.parse(snapshot.asOf)
  ) throw new Error("PHYSICAL_SNAPSHOT_EXPIRED");
  const nodes = new Map(snapshot.nodes.map((n) => [n.id, n]));
  if (nodes.size !== snapshot.nodes.length || new Set(snapshot.links.map((e) => e.id)).size !== snapshot.links.length)
    throw new Error("PHYSICAL_DUPLICATE_IDENTIFIER");
  const resourceBindings = new Set<string>();
  for (const node of snapshot.nodes) {
    if (!node.evidenceIds.every((ev) => core.evidence.some((e) => e.id === ev)))
      throw new Error("PHYSICAL_MISSING_NODE_EVIDENCE");
    if (node.kind === "machine" || node.kind === "line") {
      const resource = core.entities.find((e) => e.id === node.coreResourceId && e.kind === "resource");
      if (!resource || resource.attributes.resourceType !== node.kind || resource.attributes.facilityId !== core.entities.find((e) => e.kind === "facility")?.id)
        throw new Error("PHYSICAL_RESOURCE_BINDING_INVALID");
      if (resourceBindings.has(resource.id)) throw new Error("PHYSICAL_DUPLICATE_RESOURCE_BINDING");
      resourceBindings.add(resource.id);
    } else if (node.coreResourceId !== null)
      throw new Error("PHYSICAL_NON_RESOURCE_BINDING");
  }
  const outgoing = new Map<string, PhysicalSnapshot["links"]>();
  for (const link of snapshot.links) {
    const from = nodes.get(link.from), to = nodes.get(link.to);
    if (!from || !to || link.from === link.to)
      throw new Error("PHYSICAL_INVALID_LINK");
    if (!link.evidenceIds.every((ev) => core.evidence.some((e) => e.id === ev)))
      throw new Error("PHYSICAL_MISSING_LINK_EVIDENCE");
    if (link.kind === "power_feed") {
      if (!["supply", "transformer", "panel", "meter"].includes(from.kind) ||
        !["transformer", "panel", "meter", "machine"].includes(to.kind))
        throw new Error("PHYSICAL_INVALID_POWER_DIRECTION");
      outgoing.set(from.id, [...(outgoing.get(from.id) ?? []), link]);
    } else if (from.kind !== "machine" || to.kind !== "line")
      throw new Error("PHYSICAL_INVALID_LINE_MEMBERSHIP");
  }
  for (const node of snapshot.nodes) {
    const visited = new Set<string>();
    const walk = (id: string, ancestors: Set<string>) => {
      if (ancestors.has(id)) throw new Error("PHYSICAL_POWER_CYCLE");
      if (visited.has(id)) return;
      visited.add(id);
      const path = new Set(ancestors);
      path.add(id);
      for (const edge of outgoing.get(id) ?? []) walk(edge.to, path);
    };
    walk(node.id, new Set());
  }
  const incident = snapshot.incident;
  if (incident) {
    const node = nodes.get(incident.subjectNodeId);
    if (!node) throw new Error("PHYSICAL_INCIDENT_NODE_MISSING");
    if ((incident.type === "machine_stop") !== (node.kind === "machine"))
      throw new Error("PHYSICAL_INCIDENT_KIND_INVALID");
    if (!incident.evidenceIds.every((ev) => core.evidence.some((e) => e.id === ev)))
      throw new Error("PHYSICAL_INCIDENT_EVIDENCE_MISSING");
    if (Date.parse(incident.at) > Date.parse(at))
      throw new Error("PHYSICAL_FUTURE_INCIDENT");
  }
  return { nodes, outgoing };
}

function relatedOrders(core: CoreInput, resourceId: string) {
  const operations = core.entities.filter((e) => e.kind === "operation" && e.attributes.resourceId === resourceId);
  const opIds = new Set(operations.map((op) => op.id));
  const routings = core.entities.filter(
    (e) => e.kind === "routing" && (e.attributes.operationIds as string[]).some((id) => opIds.has(id)),
  );
  const routingIds = new Set(routings.map((e) => e.id));
  const workOrders = core.entities.filter((e) => e.kind === "work_order" && routingIds.has(String(e.attributes.routingId)));
  const orderIds = new Set(workOrders.map((e) => String(e.attributes.orderId)));
  return core.entities
    .filter((e) => e.kind === "order" && orderIds.has(e.id))
    .map((order) => {
      const materialIds = core.entities
        .filter((e) => e.kind === "bom" && e.attributes.productId === order.attributes.productId)
        .flatMap((e) => e.attributes.materialIds as string[]);
      return {
        orderId: order.id,
        workOrderIds: workOrders.filter((w) => w.attributes.orderId === order.id).map((w) => w.id),
        operationIds: operations.filter((op) => routings.some((r) =>
          r.id === workOrders.find((w) => w.attributes.orderId === order.id)?.attributes.routingId &&
          (r.attributes.operationIds as string[]).includes(op.id),
        )).map((op) => op.id),
        materialIds: [...new Set(materialIds)],
        evidenceIds: order.evidenceIds,
      };
    });
}

export function evaluatePhysicalSnapshot(rawCore: unknown, rawSnapshot: unknown, at: string) {
  const core = inputSchema.parse(rawCore);
  const snapshot = physicalSnapshotSchema.parse(rawSnapshot);
  const { nodes, outgoing } = inspect(core, snapshot, at);
  const incident = snapshot.incident;
  const paths = new Map<string, { path: string[]; evidenceIds: string[]; confidence: "verified" | "uncertain" }>();
  if (incident) {
    const initial = nodes.get(incident.subjectNodeId)!;
    const accepted = incident.observation === "verified" &&
      evidenceReady(core, incident.evidenceIds, at) &&
      initial.verification === "verified" &&
      evidenceReady(core, initial.evidenceIds, at);
    const queue = [{ id: initial.id, path: [initial.id], evidenceIds: [...incident.evidenceIds, ...initial.evidenceIds], verified: accepted }];
    while (queue.length) {
      const current = queue.shift()!;
      const node = nodes.get(current.id)!;
      if (node.kind === "machine") {
        const confidence = current.verified && incident.type === "machine_stop" ? "verified" : "uncertain";
        const prior = paths.get(node.id);
        if (!prior || (confidence === "verified" && prior.confidence !== "verified"))
          paths.set(node.id, { path: current.path, evidenceIds: [...new Set(current.evidenceIds)], confidence });
      }
      if (incident.type === "machine_stop") continue;
      for (const edge of outgoing.get(current.id) ?? []) {
        if (current.path.includes(edge.to)) continue;
        const next = nodes.get(edge.to)!;
        queue.push({
          id: edge.to,
          path: [...current.path, edge.to],
          evidenceIds: [...current.evidenceIds, ...edge.evidenceIds, ...next.evidenceIds],
          verified: current.verified && edge.verification === "verified" &&
            next.verification === "verified" &&
            evidenceReady(core, edge.evidenceIds, at) &&
            evidenceReady(core, next.evidenceIds, at),
        });
      }
    }
  }
  const impacts = [...paths.entries()].map(([nodeId, data]) => {
    const node = nodes.get(nodeId)!;
    return {
      nodeId,
      machine: node.label,
      resourceId: node.coreResourceId!,
      path: data.path,
      evidenceIds: data.evidenceIds,
      exposure: incident?.type === "machine_stop" && data.confidence === "verified"
        ? "confirmed_machine_unavailable" as const : "potentially_affected" as const,
      orders: relatedOrders(core, node.coreResourceId!),
    };
  });
  // Only a verified, explicitly observed machine stop becomes an actual core downtime event.
  // A panel/transformer alarm or suspicious correlation does not certify machine outage.
  const derived = structuredClone(core);
  if (incident?.type === "machine_stop" && impacts[0]?.exposure === "confirmed_machine_unavailable") {
    derived.entities.push({
      id: `physical-event-${incident.id}`,
      kind: "event",
      label: "Fictional verified machine-stop observation",
      version: 1,
      ownerOrganizationId: core.organizationId,
      basis: "record",
      evidenceIds: incident.evidenceIds,
      validFrom: core.asOf,
      validUntil: core.validUntil,
      attributes: {
        eventType: "downtime",
        subjectIds: [impacts[0].resourceId],
        at: incident.at,
      },
    });
  }
  // Reuse the SAME decision engine rather than a new feasibility rule set.
  const decision = evaluate(derived, at);
  const caution = !!incident && (
    incident.type !== "machine_stop" ||
    impacts.length === 0 ||
    impacts.some((impact) => impact.exposure === "potentially_affected")
  );
  return {
    schemaVersion: "gm-physical-demo/v1" as const,
    origin: "synthetic" as const,
    asOf: at,
    incident,
    topology: snapshot.nodes.map((n) => ({
      id: n.id, label: n.label, kind: n.kind, model: n.model,
      verification: n.verification, sourceIds: n.evidenceIds,
    })),
    connections: snapshot.links.map((e) => ({
      from: e.from, to: e.to, kind: e.kind, verification: e.verification, sourceIds: e.evidenceIds,
    })),
    impacts,
    decision,
    decisionReadiness: decision.ownerIntentAssessment?.conflicts.length
      ? "owner_conflict_requires_review" as const
      : decision.ownerIntentAssessment?.inferredGoalsRequireConfirmation.length
        ? "owner_goal_needs_confirmation" as const
        : caution ? "requires_fact_confirmation" as const
        : incident?.type === "machine_stop" ? "machine_unavailable_review" as const
        : "sample_evaluation_only" as const,
    recommendedActionId: caution || !!decision.ownerIntentAssessment?.conflicts.length
      ? null : decision.recommendation,
    inferredCause: null,
    verifiedSavings: null,
    authorizedMachineControl: false,
    customerValidated: false,
  };
}

export const physicalScenarioIds = [
  "normal", "machine_stop", "panel_alarm", "suspected_fault",
  "owner_machine_conflict", "owner_avoid_feasible", "owner_inferred",
] as const;
export function physicalFixture(scenario: (typeof physicalScenarioIds)[number]) {
  const core = fixture("A");
  const add = (id: string, kind: CoreInput["entities"][number]["kind"], attributes: Record<string, unknown>) => {
    core.entities.push({
      id, kind, label: `FICTIONAL ${id}`, version: 1,
      ownerOrganizationId: core.organizationId, basis: "record",
      evidenceIds: ["source"], validFrom: "2026-10-20T00:00:00.000Z",
      validUntil: core.validUntil, attributes,
    });
  };
  add("second-material", "material", {
    specificationId: "spec", producerId: "approved-producer", unit: "kg",
  });
  add("second-process", "process", {
    inputIds: ["second-material"], outputIds: ["second-part"],
  });
  add("press-second", "resource", {
    resourceType: "machine", facilityId: "plant", assetRef: null, processIds: ["second-process"],
  });
  add("press-second-capability", "capability", {
    resourceId: "press-second", processId: "second-process", verification: "verified",
  });
  add("line-one", "resource", {
    resourceType: "line", facilityId: "plant", assetRef: null, processIds: ["stamping"],
  });
  add("line-two", "resource", {
    resourceType: "line", facilityId: "plant", assetRef: null, processIds: ["second-process"],
  });
  add("second-part", "product", { revision: "R2", specificationId: "spec", unit: "part" });
  add("second-bom", "bom", {
    productId: "second-part", revision: "R2", materialIds: ["second-material"],
    quantities: { "second-material": 1 }, quantityUnits: { "second-material": "kg" },
  });
  add("second-operation", "operation", {
    processId: "second-process", resourceId: "press-second", predecessorIds: [],
  });
  add("second-routing", "routing", {
    productId: "second-part", revision: "R2", operationIds: ["second-operation"],
  });
  add("second-order", "order", {
    customerId: "buyer", productId: "second-part", revision: "R2", quantity: 40, dueAt: core.validUntil,
  });
  add("second-work-order", "work_order", {
    orderId: "second-order", routingId: "second-routing", quantity: 40,
  });
  add("second-shift", "shift", {
    resourceId: "press-second", facilityId: "plant",
    startsAt: REPLAY_AT, endsAt: "2026-10-20T20:00:00.000Z", availableMinutes: 300,
  });
  const nodeDefinitions: Array<Omit<PhysicalSnapshot["nodes"][number], "evidenceIds" | "verification">> = [
    { id: "grid", kind: "supply", label: "Fictional site supply", coreResourceId: null, model: null },
    { id: "transformer", kind: "transformer", label: "Transformer T1", coreResourceId: null, model: null },
    { id: "panel", kind: "panel", label: "Panel P1", coreResourceId: null, model: null },
    { id: "meter", kind: "meter", label: "Meter M1", coreResourceId: null, model: null },
    { id: "machine-one", kind: "machine", label: "Press 01", coreResourceId: "press", model: "Fictional press model A" },
    { id: "machine-two", kind: "machine", label: "Press 02", coreResourceId: "press-second", model: "Fictional press model B" },
    { id: "line-a", kind: "line", label: "Stamping line A", coreResourceId: "line-one", model: null },
    { id: "line-b", kind: "line", label: "Stamping line B", coreResourceId: "line-two", model: null },
  ];
  const nodes: PhysicalSnapshot["nodes"] = nodeDefinitions.map((n) => ({
    ...n, evidenceIds: ["source"], verification: "verified",
  }));
  const links: PhysicalSnapshot["links"] = [
    ["grid", "transformer", "power_feed"],
    ["transformer", "panel", "power_feed"],
    ["panel", "meter", "power_feed"],
    ["meter", "machine-one", "power_feed"],
    ["panel", "machine-two", "power_feed"],
    ["machine-one", "line-a", "line_membership"],
    ["machine-two", "line-b", "line_membership"],
  ].map(([from, to, kind], index) => ({
    id: `connection-${index}`, from, to, kind: kind as "power_feed" | "line_membership",
    evidenceIds: ["source"], verification: "verified",
  }));
  // The owner scenarios use the same equipment and order facts. These are
  // explicit *fictional* owner statements, never imported or real approvals.
  const ownerMachineConflict = scenario === "owner_machine_conflict";
  const confirmedAvoidance = scenario === "owner_avoid_feasible";
  const inferredAvoidance = scenario === "owner_inferred";
  if (ownerMachineConflict || confirmedAvoidance || inferredAvoidance) {
    const stated = !inferredAvoidance;
    core.ownerIntents = [{
      id: "fictional-owner-objective",
      ownerOrganizationId: core.organizationId,
      statement: ownerMachineConflict
        ? "Fictional owner wants to deliver the important customer order using Press 01"
        : "Fictional owner prefers not to allocate Press 01 to this order",
      goal: "relationship",
      preference: ownerMachineConflict ? "favor" : "avoid",
      source: stated ? "owner_stated" : "inferred",
      status: stated ? "confirmed" : "proposed",
      confirmedBy: stated ? "SYNTHETIC-owner-confirmation-not-real" : null,
      counterpartyId: "buyer",
      relatedActionIds: ["produce-approved"],
      evidenceIds: ["source"],
      effectiveFrom: core.asOf,
      expiresAt: core.validUntil,
    }];
  }
  const machineStop = scenario === "machine_stop" || ownerMachineConflict;
  const incident: PhysicalSnapshot["incident"] =
    ["normal", "owner_avoid_feasible", "owner_inferred"].includes(scenario) ? null : {
    id: `fictional-${scenario}`,
    subjectNodeId: machineStop ? "machine-one" : "panel",
    type: machineStop ? "machine_stop" :
      scenario === "panel_alarm" ? "power_interruption" : "suspected_power_fault",
    at: REPLAY_AT,
    evidenceIds: ["source"],
    observation: scenario === "suspected_fault" ? "hypothesis" : "verified",
  };
  const snapshot: PhysicalSnapshot = {
    schemaVersion: "gm-physical-001/v1", origin: "synthetic",
    organizationId: core.organizationId, factoryId: core.factoryId,
    asOf: core.asOf, validUntil: core.validUntil, nodes, links, incident,
  };
  return { core: inputSchema.parse(core), snapshot: physicalSnapshotSchema.parse(snapshot) };
}
export function runPhysicalScenario(scenario: (typeof physicalScenarioIds)[number]) {
  const { core, snapshot } = physicalFixture(scenario);
  return evaluatePhysicalSnapshot(core, snapshot, REPLAY_AT);
}
