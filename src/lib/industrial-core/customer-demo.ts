import { digest } from "./engine";
import { runScenario, scenarioIds } from "./fixtures";

const stories = {
  A: {
    title: "Can we accept this component order?",
    question:
      "A fictional manufacturer receives an order for 100 components. Is the specified revision feasible with permitted material and the available press?",
  },
  B: {
    title: "Could another industry use this surplus?",
    question:
      "A fictional seller has uncommitted material and a possible buyer. Are technical compatibility, verified demand, sharing and supplier qualification sufficient to propose a trade?",
  },
  C: {
    title: "What changes when the press stops?",
    question:
      "The same fictional press becomes unavailable. Which operations and orders are affected, and is any supplied alternative still supported?",
  },
  D: {
    title: "Should we buy the cheaper material?",
    question:
      "A fictional contract permits one material producer. The only supplied alternative uses an unapproved producer. Can lower cost justify it?",
  },
} as const;

export function explainCheck(reason: string) {
  const explanations: Record<string, string> = {
    CONDITION_SATISFIED: "The reviewed sample requirement is satisfied.",
    MANDATORY_REQUIREMENT_FAILED: "This alternative does not meet a mandatory requirement.",
    RULE_NOT_VERIFIED:
      "An authorized person must verify this rule before it can support a decision.",
    RESOURCE_UNAVAILABLE: "A recorded disruption makes the required resource unavailable.",
    BOM_MATERIAL_REQUIREMENT_NOT_MET: "The unreserved material does not cover the BOM requirement.",
    ENGINEERING_REVISION_MISMATCH: "The product, order or engineering revision does not agree.",
    BUYER_DEMAND_NOT_VERIFIED:
      "The buyer's demand is still a possibility, not a verified requirement.",
    SUPPLIERQUALIFIED_UNKNOWN: "The supplier's qualification for this buyer is unknown.",
    BILATERAL_SHARING_NOT_AUTHORIZED:
      "Both companies must authorize sharing these specific records.",
    STALE_OFFER_OR_DEMAND: "The offer or demand has expired and needs fresh evidence.",
    SNAPSHOT_NOT_CURRENT: "The snapshot is outside its valid period.",
  };
  return explanations[reason] ?? reason.toLowerCase().replaceAll("_", " ");
}

// Read-only presentation of the existing engine. No caller-supplied operational data,
// grants, approvals, providers or database writes are accepted by this demonstration.
export async function customerDemo(scenario: (typeof scenarioIds)[number]) {
  const replay = runScenario(scenario);
  const input = replay.decision.inputSnapshot;
  const entity = (id: string) => input.entities.find((e) => e.id === id)!;
  const order = entity("order").attributes;
  const lot = entity("lot").attributes;
  const bom = entity("bom").attributes;
  const shift = entity("shift").attributes;
  const reserved = input.entities
    .filter((e) => e.kind === "reservation" && e.attributes.lotId === "lot")
    .reduce((sum, e) => sum + Number(e.attributes.quantity), 0);
  const approved = input.actions.find((a) => a.id === "produce-approved");
  const requiredCapacity = input.constraints.find((r) => r.id === "capacity")!;
  const recommendation = replay.decision.alternatives.find(
    (a) => a.actionId === replay.decision.recommendation,
  );
  const opportunity = replay.opportunity;
  const conclusion =
    scenario === "B"
      ? {
          status: opportunity!.status,
          title: "Qualification is incomplete",
          next: "Verify buyer demand and supplier qualification before requesting commercial approval. Do not publish private stock or place a trade.",
        }
      : recommendation
        ? {
            status: recommendation.status,
            title: "One supplied alternative meets the sample checks",
            next: "Ask the authorized commercial and safety reviewers to approve the exact decision before any supported action.",
          }
        : {
            status: replay.decision.alternatives.every((a) => a.status === "prohibited")
              ? "prohibited"
              : "requires_review",
            title: "No supported alternative can proceed",
            next:
              scenario === "D"
                ? "Obtain permitted material or refer the sourcing restriction to its authorized owner. A lower price cannot waive it."
                : "Confirm the outage and obtain a reviewed feasible resource or schedule alternative. Re-evaluate and obtain new approval.",
          };
  return {
    schemaVersion: "gridmind/customer-demo/v1" as const,
    origin: "synthetic" as const,
    scenario,
    label:
      "FICTIONAL SAMPLE — invented data, simulated source review; no real customer, approval, transaction or verified savings",
    story: stories[scenario],
    replayAt: input.asOf,
    validUntil: input.validUntil,
    inputSha256: await digest(input),
    source: input.evidence[0],
    operatingSummary: {
      manufacturer: String(entity("seller").attributes.legalName),
      customer: String(entity("buyer").attributes.legalName),
      product: "Illustrative pressed component",
      productRevision: String(entity("part").attributes.revision),
      orderQuantity: Number(order.quantity),
      orderUnit: String(entity("part").attributes.unit),
      materialPerPart: Number((bom.quantities as Record<string, number>).steel),
      materialUnit: String(lot.unit),
      requiredMaterial:
        Number(order.quantity) * Number((bom.quantities as Record<string, number>).steel),
      lotQuantity: Number(lot.quantity),
      reservedQuantity: reserved,
      unreservedQuantity: Number(lot.quantity) - reserved,
      calendarMinutes: Number(shift.availableMinutes),
      requiredMinutes: Number(requiredCapacity.condition.value),
      resourceAvailable: !replay.decision.disruptionImpacts.some((i) =>
        i.affected.some((e) => e.id === "press"),
      ),
      requiredAuthorities: approved?.requiredAuthorities ?? input.actions[0].requiredAuthorities,
    },
    conclusion,
    checks: replay.decision.alternatives.map((a) => ({
      actionId: a.actionId,
      label: a.label,
      status: a.status,
      checks: a.checks.map((c) => ({
        ...c,
        explanation: explainCheck(c.reason),
        requirement: input.constraints.find((r) => r.id === c.ruleId)?.condition ?? null,
      })),
    })),
    opportunity: opportunity
      ? { ...opportunity, explanations: opportunity.reasons.map(explainCheck) }
      : null,
    economics: replay.economics,
    workflow: replay.workflow,
    customerInputs: [
      {
        record: "Order and engineering revision",
        fields: "Customer, part, revision, quantity, due date",
        sampleEntityIds: ["order", "part", "bom", "routing"],
      },
      {
        record: "Material and reservations",
        fields: "Lot, producer, unit, released quantity, commitments",
        sampleEntityIds: ["steel", "lot", "reservation", "inspection"],
      },
      {
        record: "Resources and production events",
        fields: "Resource capability, shift minutes, operation sequence, downtime",
        sampleEntityIds: [
          "press",
          "operation",
          "shift",
          ...(scenario === "C" ? ["disruption"] : []),
        ],
      },
      {
        record: "Rules and authorization",
        fields: "Approved source, rule version, evidence, effective period, responsible reviewer",
        sampleEntityIds: ["approved-producer"],
      },
    ],
    // Full original input and computed result remain together for export/replay.
    input,
    decision: replay.decision,
  };
}
export type CustomerDemo = Awaited<ReturnType<typeof customerDemo>>;
