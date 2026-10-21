import {
  ruleAuthority,
  inputSchema,
  type CoreInput,
  type Entity,
  type Rule,
  type Action,
} from "./model";
import { evaluate, applyDisruption } from "./engine";
import { compareEconomics } from "./economics";
import { matchOpportunity, type SharingGrant } from "./opportunities";
export const REPLAY_AT = "2026-10-20T12:00:00.000Z";
export const UNTIL = "2026-10-21T00:00:00.000Z";
export const scenarioIds = ["A", "B", "C", "D"] as const;
export function fixture(
  scenario: (typeof scenarioIds)[number],
  organizationId = 1,
  factoryId = 1,
): CoreInput {
  const entities: Entity[] = [];
  const add = (id: string, kind: Entity["kind"], attributes: Record<string, unknown>) =>
    entities.push({
      id,
      kind,
      label: `Fictional ${id}`,
      version: 1,
      ownerOrganizationId: organizationId,
      basis: "record",
      evidenceIds: ["source"],
      validFrom: "2026-10-20T00:00:00.000Z",
      validUntil: UNTIL,
      attributes,
    });
  add("industry", "industry", { code: "fictional-metal-components", parentId: null });
  add("seller", "company", {
    legalName: "SYNTHETIC Manufacturer A",
    industryId: "industry",
    organizationRef: null,
  });
  add("buyer", "company", {
    legalName: "SYNTHETIC Buyer B",
    industryId: "industry",
    organizationRef: null,
  });
  add("approved-producer", "company", {
    legalName: "SYNTHETIC Approved Producer",
    industryId: "industry",
    organizationRef: null,
  });
  add("alternative-producer", "company", {
    legalName: "SYNTHETIC Alternative Producer",
    industryId: "industry",
    organizationRef: null,
  });
  add("plant", "facility", { companyId: "seller", factoryRef: factoryId });
  add("spec", "specification", { version: "S1", requirements: [] });
  add("part", "product", { revision: "R2", specificationId: "spec", unit: "part" });
  add("steel", "material", {
    specificationId: "spec",
    producerId: "approved-producer",
    unit: "kg",
  });
  add("stamping", "process", { inputIds: ["steel"], outputIds: ["part"] });
  add("press", "resource", {
    resourceType: "machine",
    facilityId: "plant",
    assetRef: null,
    processIds: ["stamping"],
  });
  add("press-capability", "capability", {
    resourceId: "press",
    processId: "stamping",
    verification: "verified",
  });
  add("supply-relation", "relationship", {
    companyId: "seller",
    counterpartyId: "approved-producer",
    relationship: "supplier",
  });
  add("customer-relation", "relationship", {
    companyId: "seller",
    counterpartyId: "buyer",
    relationship: "customer",
  });
  add("bom", "bom", {
    productId: "part",
    revision: "R2",
    materialIds: ["steel"],
    quantities: { steel: 1 },
    quantityUnits: { steel: "kg" },
  });
  add("order", "order", {
    customerId: "buyer",
    productId: "part",
    revision: "R2",
    quantity: 100,
    dueAt: UNTIL,
  });
  add("operation", "operation", { processId: "stamping", resourceId: "press", predecessorIds: [] });
  add("routing", "routing", { productId: "part", revision: "R2", operationIds: ["operation"] });
  add("work-order", "work_order", { orderId: "order", routingId: "routing", quantity: 100 });
  add("shift", "shift", {
    resourceId: "press",
    facilityId: "plant",
    startsAt: "2026-10-20T12:00:00.000Z",
    endsAt: "2026-10-20T20:00:00.000Z",
    availableMinutes: 360,
  });
  add("lot", "lot", {
    materialId: "steel",
    producerId: "approved-producer",
    quantity: 200,
    reserved: 50,
    unit: "kg",
    quality: "released",
  });
  add("reservation", "reservation", { lotId: "lot", orderId: "order", quantity: 50, unit: "kg" });
  add("commitment", "commitment", {
    supplierId: "approved-producer",
    materialId: "steel",
    quantity: 100,
    dueAt: UNTIL,
  });
  add("inspection", "inspection", {
    lotId: "lot",
    status: "released",
    inspectorRef: "SYNTHETIC-inspector",
  });
  add("shipment", "shipment", { orderId: "order", lotIds: ["lot"], status: "planned" });
  add("invoice", "invoice", {
    orderId: "order",
    currency: "INR",
    minorUnits: 100000,
    status: "draft",
  });
  add("demand", "demand", {
    companyId: "buyer",
    productId: "part",
    quantity: 75,
    unit: "kg",
    status: "potential",
  });
  add("opportunity", "opportunity", {
    sellerId: "seller",
    buyerId: "buyer",
    productId: "part",
    kind: "surplus",
  });
  if (scenario === "C")
    add("disruption", "event", { eventType: "downtime", subjectIds: ["press"], at: REPLAY_AT });
  const constraints: Rule[] = [];
  const rule = (
    id: string,
    category: Rule["category"],
    field: Rule["condition"]["field"],
    value: Rule["condition"]["value"],
    unit: string,
    op: Rule["condition"]["op"] = "eq",
  ) =>
    constraints.push({
      id,
      ownerOrganizationId: organizationId,
      version: 1,
      category,
      evidenceIds: ["source"],
      scope: { customerId: "buyer", productId: "part", actionKinds: ["produce"] },
      effectiveFrom: "2026-10-20T00:00:00.000Z",
      expiresAt: UNTIL,
      condition: { field, op, value, unit },
      effect: "require",
      verification: "verified",
      authority: ruleAuthority(category),
      exceptionPermitted: false,
      verifiedBy: "SYNTHETIC-fixture-review-not-professional-approval",
      exception: null,
    });
  rule("approved-steel", "approved_source", "producer", ["approved-producer"], "id", "in");
  rule("revision", "revision", "revision", "R2", "id");
  rule("material", "inventory", "inventoryQuantity", 100, "kg", "gte");
  rule("capacity", "capacity", "capacityMinutes", 120, "minute", "gte");
  rule("dependency", "dependency", "processReady", true, "boolean");
  rule("safety", "safety", "safetySatisfied", true, "boolean");
  const fact = (value: string | number | boolean, unit: string) => ({
    value,
    unit,
    basis: "record" as const,
    evidenceIds: ["source"],
  });
  const base: Action = {
    id: "produce-approved",
    kind: "produce",
    label: "Use approved existing material and press",
    productId: "part",
    customerId: "buyer",
    operationIds: ["operation"],
    requiredRuleIds: constraints.map((r) => r.id),
    requiredAuthorities: ["commercial", "safety"],
    facts: {
      producer: fact("approved-producer", "id"),
      revision: fact("R2", "id"),
      inventoryQuantity: fact(150, "kg"),
      capacityMinutes: fact(360, "minute"),
      processReady: fact(true, "boolean"),
      safetySatisfied: fact(true, "boolean"),
    },
  };
  const alternative: Action = {
    ...structuredClone(base),
    id: "buy-alternative",
    label: "Cheaper unapproved producer (invented)",
    facts: { ...base.facts, producer: fact("alternative-producer", "id") },
  };
  const input: CoreInput = {
    origin: "synthetic",
    schemaVersion: "gm-core-003/v1",
    organizationId,
    factoryId,
    asOf: REPLAY_AT,
    validUntil: UNTIL,
    sourceId: `bundled-${scenario}`,
    syntheticClock: null,
    entities,
    relationships: [
      { id: "part-material", from: "part", to: "steel", type: "requires", evidenceIds: ["source"] },
      {
        id: "part-operation",
        from: "part",
        to: "operation",
        type: "requires",
        evidenceIds: ["source"],
      },
    ],
    evidence: [
      {
        id: "source",
        title: "Invented manufacturing replay — not real company records",
        source: "data/industrial-core/synthetic-source.txt",
        digest: "ffa784b1657e0c9b4020778fca1c9aa2a42e1cb127a0287357bfc1f755284a47",
        observedAt: "2026-10-20T00:00:00.000Z",
        expiresAt: UNTIL,
        verification: "verified",
        origin: "synthetic",
      },
    ],
    constraints,
    actions: scenario === "D" ? [alternative] : [base, alternative],
  };
  return inputSchema.parse(input);
}
// Only new bundled synthetic workspaces get a fresh clock. Imports and saved snapshots
// keep their supplied times; this never refreshes evidence on load or execution.
export function instantiateFixture(
  scenario: (typeof scenarioIds)[number],
  organizationId: number,
  factoryId: number,
  at: string,
): CoreInput {
  const input = fixture(scenario, organizationId, factoryId);
  const delta = Date.parse(at) - Date.parse(REPLAY_AT);
  const shift = (value: string) => new Date(Date.parse(value) + delta).toISOString();
  input.asOf = shift(input.asOf);
  input.validUntil = shift(input.validUntil);
  input.sourceId = `bundled-${scenario}@${at}`;
  for (const entity of input.entities) {
    entity.validFrom = shift(entity.validFrom);
    entity.validUntil = shift(entity.validUntil);
    for (const key of ["at", "dueAt", "startsAt", "endsAt"]) {
      const value = entity.attributes[key];
      if (typeof value === "string") entity.attributes[key] = shift(value);
    }
  }
  for (const evidence of input.evidence) {
    evidence.observedAt = shift(evidence.observedAt);
    evidence.expiresAt = shift(evidence.expiresAt);
    evidence.title = "Invented template instantiated at synthetic workspace creation";
  }
  for (const rule of input.constraints) {
    rule.effectiveFrom = shift(rule.effectiveFrom);
    rule.expiresAt = shift(rule.expiresAt);
  }
  input.syntheticClock = { templateAsOf: REPLAY_AT, instantiatedAt: at };
  return inputSchema.parse(input);
}
export function runScenario(scenario: (typeof scenarioIds)[number]) {
  const original = fixture(scenario),
    input = scenario === "C" ? applyDisruption(original, "disruption", REPLAY_AT) : original;
  const decision = evaluate(input, REPLAY_AT);
  const offer = {
    id: "offer",
    organizationId: 1,
    companyId: "seller",
    productName: "Generic component",
    specification: "S1",
    revision: "R2",
    unit: "kg",
    quantity: 200,
    committedQuantity: 50,
    evidenceIds: ["source"],
    expiresAt: UNTIL,
    kind: "surplus",
    qualityReleased: true,
    supplierQualified: null,
    contractEligible: true,
  };
  const demand = {
    id: "demand",
    organizationId: 2,
    companyId: "buyer",
    productName: "Generic component",
    specification: "S1",
    revision: "R2",
    unit: "kg",
    quantity: 75,
    evidenceIds: ["source"],
    expiresAt: UNTIL,
    status: "potential",
  };
  const grants: SharingGrant[] = [
    {
      fromOrganizationId: 1,
      toOrganizationId: 2,
      recordId: "offer",
      approvedBy: "SYNTHETIC-sharing-review",
      expiresAt: UNTIL,
    },
    {
      fromOrganizationId: 2,
      toOrganizationId: 1,
      recordId: "demand",
      approvedBy: "SYNTHETIC-sharing-review",
      expiresAt: UNTIL,
    },
  ];
  const option = {
    currency: "INR",
    revenueMinor: 100000,
    incrementalMinor: 50000,
    opportunityMinor: 10000,
    transportMinor: 3000,
    storageMinor: 2000,
    minutes: 120,
    uncertaintyMinor: 5000,
    feasible: true,
    evidenceIds: ["source"],
  };
  return {
    scenario,
    origin: "synthetic",
    decision,
    opportunity: scenario === "B" ? matchOpportunity(offer, demand, grants, REPLAY_AT) : null,
    economics:
      scenario === "B"
        ? compareEconomics([
            { ...option, id: "sell", kind: "sell_surplus" },
            { ...option, id: "retain", kind: "retain", revenueMinor: null },
          ])
        : null,
    workflow: { phase: "awaiting_approval", execution: "not_executed", outcome: "unverified" },
    label:
      "Bundled historical synthetic replay; simulated source verification and sharing, no real company attribution or transaction",
  };
}
