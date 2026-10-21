import { z } from "zod";

export const id = z.string().trim().min(1).max(100);
export const instant = z.string().datetime({ offset: true });
const scalar = z.union([z.string().max(200), z.number().finite().safe(), z.boolean()]);
export const capability = z.enum([
  "read",
  "edit",
  "commercial",
  "quality",
  "safety",
  "finance",
  "sharing",
]);
export type Capability = z.infer<typeof capability>;
export const evidenceSchema = z
  .object({
    id,
    title: z.string().min(1).max(300),
    source: z.string().min(1).max(500),
    digest: z.string().regex(/^[a-f0-9]{64}$/),
    observedAt: instant,
    expiresAt: instant,
    verification: z.enum(["unverified", "verified"]),
    origin: z.literal("synthetic"),
  })
  .strict()
  .refine((e) => Date.parse(e.expiresAt) > Date.parse(e.observedAt), "Invalid evidence interval");
export const factSchema = z
  .object({
    value: scalar.nullable(),
    unit: z.string().min(1).max(30),
    basis: z.enum(["record", "estimate", "assumption", "unknown"]),
    evidenceIds: z.array(id).min(1).max(10),
  })
  .strict();
export type Fact = z.infer<typeof factSchema>;
// Typed entity attributes are deliberately modest; records are snapshots, not an ERP ledger.
const attributes = {
  industry: z.object({ code: id, parentId: id.nullable() }),
  company: z.object({
    legalName: id,
    industryId: id,
    organizationRef: z.number().int().positive().nullable(),
  }),
  facility: z.object({ companyId: id, factoryRef: z.number().int().positive().nullable() }),
  product: z.object({ revision: id, specificationId: id, unit: id }),
  material: z.object({ specificationId: id, producerId: id, unit: id }),
  specification: z.object({ version: id, requirements: z.array(id).max(30) }),
  process: z.object({ inputIds: z.array(id).max(30), outputIds: z.array(id).max(30) }),
  resource: z.object({
    resourceType: z.enum(["machine", "work_center", "line", "labor"]),
    facilityId: id,
    assetRef: z.number().int().positive().nullable(),
    processIds: z.array(id).max(30),
  }),
  capability: z.object({
    resourceId: id,
    processId: id,
    verification: z.enum(["proposed", "verified"]),
  }),
  relationship: z.object({
    companyId: id,
    counterpartyId: id,
    relationship: z.enum(["supplier", "customer"]),
  }),
  bom: z.object({
    productId: id,
    revision: id,
    materialIds: z.array(id).min(1).max(30),
    quantities: z.record(z.number().finite().positive()),
    quantityUnits: z.record(id),
  }),
  order: z.object({
    customerId: id,
    productId: id,
    revision: id,
    quantity: z.number().finite().positive(),
    dueAt: instant,
  }),
  work_order: z.object({ orderId: id, routingId: id, quantity: z.number().finite().positive() }),
  routing: z.object({ productId: id, revision: id, operationIds: z.array(id).min(1).max(30) }),
  operation: z.object({ processId: id, resourceId: id, predecessorIds: z.array(id).max(30) }),
  shift: z.object({
    resourceId: id,
    facilityId: id,
    startsAt: instant,
    endsAt: instant,
    availableMinutes: z.number().finite().nonnegative(),
  }),
  lot: z.object({
    materialId: id,
    producerId: id,
    quantity: z.number().finite().nonnegative(),
    reserved: z.number().finite().nonnegative(),
    unit: id,
    quality: z.enum(["released", "held", "rejected", "unknown"]),
  }),
  reservation: z.object({
    lotId: id,
    orderId: id,
    quantity: z.number().finite().positive(),
    unit: id,
  }),
  commitment: z.object({
    supplierId: id,
    materialId: id,
    quantity: z.number().finite().positive(),
    dueAt: instant,
  }),
  event: z.object({
    eventType: z.enum(["production", "downtime", "delay", "quality", "business"]),
    subjectIds: z.array(id).min(1).max(30),
    at: instant,
  }),
  inspection: z.object({
    lotId: id,
    status: z.enum(["released", "held", "rejected", "unknown"]),
    inspectorRef: id,
  }),
  shipment: z.object({
    orderId: id,
    lotIds: z.array(id).min(1).max(30),
    status: z.enum(["planned", "dispatched", "received", "exception"]),
  }),
  invoice: z.object({
    orderId: id,
    currency: z.string().regex(/^[A-Z]{3}$/),
    minorUnits: z.number().int().nonnegative().safe(),
    status: z.enum(["draft", "issued", "payment_pending"]),
  }),
  constraint: z.object({ constraintId: id, authority: capability }),
  decision: z.object({ decisionId: id, version: id }),
  demand: z.object({
    companyId: id,
    productId: id,
    quantity: z.number().finite().positive(),
    unit: id,
    status: z.enum(["verified", "potential"]),
  }),
  opportunity: z.object({
    sellerId: id,
    buyerId: id,
    productId: id,
    kind: z.enum(["surplus", "capacity"]),
  }),
} as const;
export const entityKind = z.enum(
  Object.keys(attributes) as [keyof typeof attributes, ...(keyof typeof attributes)[]],
);
const entityBase = {
  id,
  kind: entityKind,
  label: id,
  version: z.number().int().positive(),
  ownerOrganizationId: z.number().int().positive(),
  basis: z.enum(["record", "estimate", "assumption", "unknown"]),
  evidenceIds: z.array(id).min(1).max(10),
  validFrom: instant,
  validUntil: instant,
};
export const entitySchema = z
  .object({ ...entityBase, attributes: z.record(z.unknown()) })
  .strict()
  .superRefine((e, ctx) => {
    const result = attributes[e.kind].strict().safeParse(e.attributes);
    if (!result.success) ctx.addIssue({ code: "custom", message: `Invalid ${e.kind} attributes` });
    if (Date.parse(e.validUntil) <= Date.parse(e.validFrom))
      ctx.addIssue({ code: "custom", message: "Invalid entity interval" });
    if (e.kind === "lot" && Number(e.attributes.reserved) > Number(e.attributes.quantity))
      ctx.addIssue({ code: "custom", message: "Reservation exceeds lot" });
    if (
      e.kind === "shift" &&
      Date.parse(String(e.attributes.endsAt)) <= Date.parse(String(e.attributes.startsAt))
    )
      ctx.addIssue({ code: "custom", message: "Invalid shift" });
  });
export type Entity = z.infer<typeof entitySchema>;
export const fields = z.enum([
  "customer",
  "producer",
  "supplier",
  "specification",
  "revision",
  "processReady",
  "machineCompatible",
  "capacityMinutes",
  "inventoryQuantity",
  "qualityReleased",
  "employeeQualified",
  "financialMinor",
  "policySatisfied",
  "regulationSatisfied",
  "safetySatisfied",
]);
export const ruleSchema = z
  .object({
    id,
    ownerOrganizationId: z.number().int().positive(),
    version: z.number().int().positive(),
    category: z.enum([
      "customer",
      "approved_source",
      "specification",
      "contract",
      "revision",
      "dependency",
      "machine",
      "capacity",
      "inventory",
      "quality",
      "qualification",
      "financial",
      "policy",
      "regulatory",
      "safety",
    ]),
    evidenceIds: z.array(id).min(1).max(10),
    scope: z
      .object({
        customerId: id.nullable(),
        productId: id.nullable(),
        actionKinds: z.array(id).min(1).max(15),
      })
      .strict(),
    effectiveFrom: instant,
    expiresAt: instant,
    condition: z
      .object({
        field: fields,
        op: z.enum(["eq", "in", "gte", "lte"]),
        value: z.union([scalar, z.array(scalar).min(1).max(30)]),
        unit: id,
      })
      .strict(),
    effect: z.enum(["require", "prohibit"]),
    verification: z.enum(["proposed", "verified"]),
    authority: capability,
    exceptionPermitted: z.boolean(),
    verifiedBy: id.nullable(),
    exception: z
      .object({
        actionId: id,
        approvedBy: id,
        expiresAt: instant,
        evidenceIds: z.array(id).min(1).max(10),
      })
      .strict()
      .nullable(),
  })
  .strict()
  .superRefine((r, c) => {
    if (Date.parse(r.expiresAt) <= Date.parse(r.effectiveFrom))
      c.addIssue({ code: "custom", message: "Invalid rule interval" });
    if ((r.condition.op === "in") !== Array.isArray(r.condition.value))
      c.addIssue({ code: "custom", message: "Invalid membership operand" });
    if (["gte", "lte"].includes(r.condition.op) && typeof r.condition.value !== "number")
      c.addIssue({ code: "custom", message: "Numeric rule required" });
    if (r.verification === "verified" && !r.verifiedBy)
      c.addIssue({ code: "custom", message: "Verified rule lacks authority" });
  });
export type Rule = z.infer<typeof ruleSchema>;
export function ruleAuthority(category: Rule["category"]): Capability {
  return category === "financial"
    ? "finance"
    : ["safety", "regulatory"].includes(category)
      ? "safety"
      : ["customer", "approved_source", "contract"].includes(category)
        ? "commercial"
        : "quality";
}
export const actionSchema = z
  .object({
    id,
    kind: id,
    label: id,
    productId: id,
    customerId: id,
    operationIds: z.array(id).max(30),
    facts: z.record(fields, factSchema),
    requiredRuleIds: z.array(id).min(1).max(30),
    requiredAuthorities: z.array(capability).min(1).max(7),
  })
  .strict();
export type Action = z.infer<typeof actionSchema>;
export const ownerIntentSchema = z.object({
  id,
  ownerOrganizationId: z.number().int().positive(),
  statement: z.string().min(1).max(500),
  goal: z.enum(["delivery","profitability","cash_flow","growth","relationship","quality","resilience","other"]),
  preference: z.enum(["favor","avoid","explore"]),
  source: z.enum(["owner_stated","inferred"]),
  status: z.enum(["proposed","confirmed","rejected"]),
  confirmedBy: id.nullable(),
  counterpartyId: id.nullable(),
  relatedActionIds: z.array(id).max(30),
  evidenceIds: z.array(id).min(1).max(10),
  effectiveFrom: instant,
  expiresAt: instant,
}).strict().superRefine((v,c) => {
  if (Date.parse(v.expiresAt)<=Date.parse(v.effectiveFrom)) c.addIssue({code:"custom",message:"Invalid owner intent interval"});
  if (v.status==="confirmed" && (v.source!=="owner_stated" || !v.confirmedBy)) c.addIssue({code:"custom",message:"Confirmation requires a stated owner objective and owner identity"});
  if (v.source==="inferred" && v.status==="confirmed") c.addIssue({code:"custom",message:"Inferred intent cannot self-confirm"});
});
export type OwnerIntent = z.infer<typeof ownerIntentSchema>;
export const inputSchema = z
  .object({
    origin: z.literal("synthetic"),
    schemaVersion: z.literal("gm-core-003/v1"),
    organizationId: z.number().int().positive(),
    factoryId: z.number().int().positive(),
    asOf: instant,
    validUntil: instant,
    sourceId: id,
    syntheticClock: z
      .object({ templateAsOf: instant, instantiatedAt: instant })
      .strict()
      .nullable()
      .default(null),
    entities: z.array(entitySchema).min(1).max(150),
    relationships: z
      .array(
        z
          .object({
            id,
            from: id,
            to: id,
            type: z.enum([
              "manufactures",
              "requires",
              "consumes",
              "supplies",
              "capable_of",
              "restricts",
              "affects",
              "precedes",
            ]),
            evidenceIds: z.array(id).min(1).max(10),
          })
          .strict(),
      )
      .max(200),
    evidence: z.array(evidenceSchema).min(1).max(100),
    constraints: z.array(ruleSchema).min(1).max(100),
    actions: z.array(actionSchema).min(1).max(30),
    ownerIntents: z.array(ownerIntentSchema).max(30).optional(),
  })
  .strict()
  .superRefine((s, c) => {
    const entities = new Set(s.entities.map((e) => e.id)),
      ev = new Set(s.evidence.map((e) => e.id)),
      rules = new Set(s.constraints.map((r) => r.id));
    const fail = (message: string) => c.addIssue({ code: "custom", message });
    for (const list of [s.entities, s.evidence, s.constraints, s.actions, s.relationships])
      if (new Set(list.map((e) => e.id)).size !== list.length) fail("Duplicate identifier");
    for (const intent of s.ownerIntents ?? []) {
      if (intent.ownerOrganizationId !== s.organizationId) fail("Foreign owner intent");
      if (intent.evidenceIds.some((x) => !ev.has(x))) fail("Unresolved intent evidence");
      if (intent.relatedActionIds.some((x) => !s.actions.some((a) => a.id === x))) fail("Unresolved intent action");
      if (intent.counterpartyId && !s.entities.some((e) => e.id === intent.counterpartyId && e.kind === "company")) fail("Unresolved intent counterparty");
    }
    if (new Set((s.ownerIntents ?? []).map((i) => i.id)).size !== (s.ownerIntents ?? []).length) fail("Duplicate owner intent");
    if (Date.parse(s.validUntil) <= Date.parse(s.asOf)) fail("Invalid input interval");
    for (const e of s.entities) {
      if (e.ownerOrganizationId !== s.organizationId) fail("Foreign entity ownership");
      if (e.evidenceIds.some((v) => !ev.has(v))) fail("Unresolved entity evidence");
      // Every *Id/*Ids attribute is a same-snapshot relationship, not an unchecked string.
      for (const [k, v] of Object.entries(e.attributes))
        if (k.endsWith("Id") || k.endsWith("Ids")) {
          if (e.kind === "constraint" && k === "constraintId") {
            if (!rules.has(String(v))) fail("Missing constraint");
            continue;
          }
          if (e.kind === "decision" && k === "decisionId") continue; // Output identity, no fabricated decision authority.
          for (const target of Array.isArray(v) ? v : v === null ? [] : [v])
            if (!entities.has(String(target))) fail("Unresolved entity reference");
        }
    }
    const referenceKinds: Record<string, string[]> = {
      companyId: ["company"],
      counterpartyId: ["company"],
      customerId: ["company"],
      supplierId: ["company"],
      producerId: ["company"],
      sellerId: ["company"],
      buyerId: ["company"],
      industryId: ["industry"],
      parentId: ["industry"],
      productId: ["product"],
      materialId: ["material"],
      materialIds: ["material"],
      specificationId: ["specification"],
      resourceId: ["resource"],
      facilityId: ["facility"],
      orderId: ["order"],
      routingId: ["routing"],
      operationIds: ["operation"],
      predecessorIds: ["operation"],
      processId: ["process"],
      processIds: ["process"],
      lotId: ["lot"],
      lotIds: ["lot"],
    };
    for (const entity of s.entities)
      for (const [field, value] of Object.entries(entity.attributes))
        if (referenceKinds[field])
          for (const target of Array.isArray(value) ? value : value === null ? [] : [value]) {
            const found = s.entities.find((e) => e.id === target);
            if (found && !referenceKinds[field].includes(found.kind))
              fail("Incorrect relationship entity kind");
          }
    for (const bom of s.entities.filter((e) => e.kind === "bom"))
      for (const material of bom.attributes.materialIds as string[])
        if (
          !(material in (bom.attributes.quantities as object)) ||
          !(material in (bom.attributes.quantityUnits as object))
        )
          fail("Incomplete BOM quantity or unit");
    const visiting = new Set<string>(),
      visited = new Set<string>();
    const visit = (op: string): boolean => {
      if (visiting.has(op)) return false;
      if (visited.has(op)) return true;
      visiting.add(op);
      const entity = s.entities.find((e) => e.id === op && e.kind === "operation");
      for (const predecessor of (entity?.attributes.predecessorIds ?? []) as string[])
        if (!visit(predecessor)) return false;
      visiting.delete(op);
      visited.add(op);
      return true;
    };
    if (s.entities.filter((e) => e.kind === "operation").some((e) => !visit(e.id)))
      fail("Cyclic operation dependencies");
    for (const edge of s.relationships)
      if (
        !entities.has(edge.from) ||
        !entities.has(edge.to) ||
        edge.evidenceIds.some((v) => !ev.has(v))
      )
        fail("Unresolved relationship");
    for (const r of s.constraints)
      if (r.ownerOrganizationId !== s.organizationId || r.evidenceIds.some((v) => !ev.has(v)))
        fail("Invalid rule ownership/evidence");
    for (const a of s.actions) {
      if (
        !entities.has(a.productId) ||
        !entities.has(a.customerId) ||
        a.operationIds.some((v) => !entities.has(v))
      )
        fail("Unresolved action scope");
      if (a.requiredRuleIds.some((v) => !rules.has(v))) fail("Missing mandatory rule");
      for (const f of Object.values(a.facts))
        if (f.evidenceIds.some((v) => !ev.has(v))) fail("Unresolved fact evidence");
    }
  });
export type CoreInput = z.infer<typeof inputSchema>;
export type Context = { actorId: string; capabilities: Capability[]; now: string };
export const verdict = z.enum([
  "eligible",
  "prohibited",
  "conditional",
  "unknown",
  "requires_review",
]);
export type Verdict = z.infer<typeof verdict>;
