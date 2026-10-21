import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { inputSchema, ruleSchema, type Rule } from "./model";
import { evaluate, digest, applyDisruption, evaluateRule } from "./engine";
import { fixture, instantiateFixture, REPLAY_AT, UNTIL, runScenario } from "./fixtures";
import { compareEconomics } from "./economics";
import { matchOpportunity } from "./opportunities";
import { approveWorkflow, executeWorkflow, transactionKind, type Workflow } from "./workflow";
const first = (input = fixture("A")) => evaluate(input, REPLAY_AT).alternatives[0];
describe("GM-CORE-003 evidence-backed synthetic core", () => {
  it("runs all four real deterministic scenario paths with no real-company claim", () => {
    expect(runScenario("A").decision.recommendation).toBe("produce-approved");
    expect(runScenario("B").opportunity?.status).toBe("requires_review");
    expect(runScenario("B").economics?.status).toBe("insufficient_information");
    expect(runScenario("C").decision.recommendation).toBeNull();
    expect(runScenario("C").decision.alternatives.every((a) => a.status === "prohibited")).toBe(
      true,
    );
    expect(runScenario("D").decision.disposition).toBe("no_permitted_alternative");
    expect(JSON.stringify(runScenario("D"))).not.toMatch(/Tata/);
  });
  it("preserves exact bundled evidence bytes and a reproducible source digest", async () => {
    const source = readFileSync(
      new URL("../../../data/industrial-core/synthetic-source.txt", import.meta.url),
    );
    const actual = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", source)), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
    expect(fixture("A").evidence[0].digest).toBe(actual);
  });
  it("rejects foreign ownership, dangling references, duplicate records and real origin", () => {
    for (const change of [
      (s: ReturnType<typeof fixture>) => (s.entities[0].ownerOrganizationId = 99),
      (s: ReturnType<typeof fixture>) => (s.relationships[0].to = "missing"),
      (s: ReturnType<typeof fixture>) => s.entities.push(s.entities[0]),
    ]) {
      const s = fixture("A");
      change(s);
      expect(inputSchema.safeParse(s).success).toBe(false);
    }
    expect(inputSchema.safeParse({ ...fixture("A"), origin: "customer" }).success).toBe(false);
  });
  it("rejects cyclic routes, wrong entity kinds and incomplete BOMs", () => {
    for (const mutate of [
      (s: ReturnType<typeof fixture>) =>
        (s.entities.find((e) => e.id === "operation")!.attributes.predecessorIds = ["operation"]),
      (s: ReturnType<typeof fixture>) =>
        (s.entities.find((e) => e.id === "order")!.attributes.productId = "seller"),
      (s: ReturnType<typeof fixture>) =>
        (s.entities.find((e) => e.id === "bom")!.attributes.quantities = {}),
    ]) {
      const s = fixture("A");
      mutate(s);
      expect(inputSchema.safeParse(s).success).toBe(false);
    }
  });
  it("does not accept manually asserted successful payment records", () => {
    const s = fixture("A");
    s.entities.find((e) => e.id === "invoice")!.attributes.status = "externally_confirmed";
    expect(inputSchema.safeParse(s).success).toBe(false);
  });
  it("does not waive safety requirements through an exception", () => {
    const s = fixture("A"),
      rule = s.constraints.find((r) => r.category === "safety")!;
    rule.exceptionPermitted = true;
    rule.exception = {
      actionId: s.actions[0].id,
      approvedBy: "synthetic",
      expiresAt: UNTIL,
      evidenceIds: ["source"],
    };
    expect(evaluateRule(s, s.actions[0], rule, REPLAY_AT).status).toBe("requires_review");
  });
  it("blocks unapproved producer even if a hypothetical cheaper price is suggested", () => {
    const r = runScenario("D").decision.alternatives[0];
    expect(r.status).toBe("prohibited");
    expect(r.checks.find((c) => c.ruleId === "approved-steel")?.reason).toBe(
      "MANDATORY_REQUIREMENT_FAILED",
    );
  });
  it("cannot bind an extracted rule without verification", () => {
    const s = fixture("A");
    s.constraints[0].verification = "proposed";
    s.constraints[0].verifiedBy = null;
    expect(first(s).status).toBe("requires_review");
  });
  it("does not silently ignore expired mandatory rules", () => {
    const s = fixture("A");
    s.constraints[0].expiresAt = REPLAY_AT;
    expect(first(s).status).toBe("unknown");
  });
  it("blocks conflicting mandatory requirements instead of selecting a favored rule", () => {
    const s = fixture("A");
    s.constraints.push({
      ...s.constraints[0],
      id: "conflict",
      condition: { ...s.constraints[0].condition, value: ["alternative-producer"] },
    });
    expect(first(s).status).toBe("prohibited");
  });
  it("missing material is unknown, not invented stock or an assumed zero", () => {
    const s = fixture("A");
    s.entities = s.entities.filter(
      (e) => !["lot", "reservation", "inspection", "shipment"].includes(e.kind),
    );
    expect(first(s).checks.find((c) => c.ruleId === "material")?.status).toBe("unknown");
  });
  it("uses uncommitted typed lots instead of a forged stock fact", () => {
    const s = fixture("A");
    s.entities.find((e) => e.id === "lot")!.attributes.quantity = 100;
    s.actions[0].facts.inventoryQuantity!.value = 999999;
    expect(first(s).status).toBe("prohibited");
  });
  it("rejects mismatched reservation totals", () => {
    const s = fixture("A");
    s.entities.find((e) => e.id === "reservation")!.attributes.quantity = 20;
    expect(first(s).status).toBe("unknown");
  });
  it("does not count held material as released stock", () => {
    const s = fixture("A");
    s.entities.find((e) => e.id === "lot")!.attributes.quality = "held";
    expect(first(s).status).toBe("prohibited");
  });
  it("derives capacity from operating records rather than submitted fact text", () => {
    const s = fixture("A");
    s.entities.find((e) => e.id === "shift")!.attributes.availableMinutes = 100;
    s.actions[0].facts.capacityMinutes!.value = 10000;
    expect(first(s).status).toBe("prohibited");
  });
  it("blocks wrong customer/product and engineering revisions", () => {
    const s = fixture("A");
    s.entities.find((e) => e.id === "order")!.attributes.revision = "R1";
    expect(first(s).checks.some((c) => c.reason === "ORDER_PRODUCT_REVISION_MISMATCH")).toBe(true);
    expect(first(s).status).toBe("prohibited");
  });
  it("fails closed for stale snapshot, future evidence, expired entities and units", () => {
    const stale = fixture("A");
    stale.validUntil = REPLAY_AT;
    expect(inputSchema.safeParse(stale).success).toBe(false);
    const future = fixture("A");
    future.evidence[0].observedAt = "2026-10-20T13:00:00.000Z";
    expect(first(future).status).toBe("unknown");
    const expired = fixture("A");
    expired.entities.find((e) => e.id === "press")!.validUntil = REPLAY_AT;
    expect(first(expired).status).toBe("unknown");
    const units = fixture("A");
    units.constraints.find((r) => r.id === "capacity")!.condition.unit = "hour";
    expect(first(units).status).toBe("unknown");
  });
  it("retains estimates as conditional rather than verified eligibility", () => {
    const s = fixture("A");
    s.actions[0].facts.safetySatisfied!.basis = "assumption";
    expect(first(s).status).toBe("conditional");
  });
  it("records approved exceptions explicitly and rejects expired exception evidence", () => {
    const s = fixture("D");
    s.constraints[0].exceptionPermitted = true;
    s.constraints[0].exception = {
      actionId: s.actions[0].id,
      approvedBy: "synthetic-authority",
      expiresAt: UNTIL,
      evidenceIds: ["source"],
    };
    expect(evaluate(s, REPLAY_AT).alternatives[0].checks[0].status).toBe("conditional");
    s.constraints[0].exception.expiresAt = REPLAY_AT;
    expect(evaluate(s, REPLAY_AT).alternatives[0].checks[0].status).toBe("requires_review");
  });
  it("retains input, constraint versions, algorithm, alternatives and unknown outcomes", async () => {
    const e = evaluate(fixture("A"), REPLAY_AT);
    expect(e.inputSnapshot.entities.length).toBeGreaterThan(20);
    expect(e.constraintVersions.length).toBe(6);
    expect(e.excludedAlternatives.length).toBe(1);
    expect(e.actualOutcome).toBeNull();
    expect(e.verifiedSavings).toBeNull();
    expect(await digest(e)).toHaveLength(64);
  });
  it("re-evaluates machine disruptions and propagates affected dependencies", () => {
    const s = fixture("C");
    const changed = applyDisruption(s, "disruption", REPLAY_AT);
    expect(changed.actions[0].facts.processReady?.value).toBe(false);
    const result = evaluate(changed, REPLAY_AT);
    expect(result.recommendation).toBeNull();
    expect(result.disruptionImpacts[0].affected).toEqual(
      expect.arrayContaining([
        { id: "operation", kind: "operation" },
        { id: "order", kind: "order" },
        { id: "work-order", kind: "work_order" },
      ]),
    );
  });
  it.each([
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
  ] as Rule["category"][])(
    "evaluates structured %s category with the same fail-closed mechanism",
    (category) => {
      const s = fixture("A"),
        r = ruleSchema.parse({
          ...s.constraints[0],
          category,
          condition: { field: "safetySatisfied", op: "eq", value: true, unit: "boolean" },
        });
      expect(evaluateRule(s, s.actions[0], r, REPLAY_AT).status).toBe("eligible");
    },
  );
});
const option = {
  currency: "INR",
  kind: "make",
  revenueMinor: 100000,
  incrementalMinor: 40000,
  opportunityMinor: 10000,
  transportMinor: 1000,
  storageMinor: 1000,
  minutes: 120,
  uncertaintyMinor: 5000,
  feasible: true,
  evidenceIds: ["source"],
};
describe("economic and qualification boundaries", () => {
  it("returns reproducible integer minor-unit ranges without ranking uncertain alternatives", () => {
    const r = compareEconomics([
      { ...option, id: "make" },
      { ...option, id: "outsource", incrementalMinor: 50000 },
    ]);
    expect(r.results[0]).toMatchObject({ netMinor: 48000, rangeMinor: [43000, 53000] });
    expect(r.recommendation).toBeNull();
  });
  it("returns structured missing/currency/infeasible states", () => {
    expect(
      compareEconomics([
        { ...option, id: "a", revenueMinor: null },
        { ...option, id: "b" },
      ]).status,
    ).toBe("insufficient_information");
    expect(
      compareEconomics([
        { ...option, id: "a", currency: "USD" },
        { ...option, id: "b" },
      ]).status,
    ).toBe("insufficient_information");
    expect(
      compareEconomics([
        { ...option, id: "a", feasible: false },
        { ...option, id: "b" },
      ]).results[0].status,
    ).toBe("prohibited");
  });
  it("rejects fractional, negative and duplicate price inputs", () => {
    for (const incrementalMinor of [-1, 1.5, Infinity])
      expect(() =>
        compareEconomics([
          { ...option, id: "a", incrementalMinor },
          { ...option, id: "b" },
        ]),
      ).toThrow();
    expect(() =>
      compareEconomics([
        { ...option, id: "a" },
        { ...option, id: "a" },
      ]),
    ).toThrow();
  });
  const offer = {
    id: "stock",
    organizationId: 1,
    companyId: "a",
    productName: "Same name",
    specification: "S1",
    revision: "R1",
    unit: "kg",
    quantity: 100,
    committedQuantity: 20,
    evidenceIds: ["source"],
    expiresAt: UNTIL,
    kind: "surplus",
    qualityReleased: true,
    supplierQualified: true,
    contractEligible: true,
  };
  const demand = {
    id: "need",
    organizationId: 2,
    companyId: "b",
    productName: "Same name",
    specification: "S1",
    revision: "R1",
    unit: "kg",
    quantity: 50,
    evidenceIds: ["source"],
    expiresAt: UNTIL,
    status: "verified",
  };
  const grants = [
    {
      fromOrganizationId: 1,
      toOrganizationId: 2,
      recordId: "stock",
      expiresAt: UNTIL,
      approvedBy: "a-authority",
    },
    {
      fromOrganizationId: 2,
      toOrganizationId: 1,
      recordId: "need",
      expiresAt: UNTIL,
      approvedBy: "b-authority",
    },
  ];
  it("does not expose stock or match on names without bilateral sharing", () => {
    expect(matchOpportunity(offer, demand, [], REPLAY_AT)).toEqual({
      status: "requires_review",
      reasons: ["BILATERAL_SHARING_NOT_AUTHORIZED"],
      quantity: null,
    });
  });
  it("requires technical, quality, demand, source, uncommitted quantity and contractual qualification", () => {
    expect(matchOpportunity(offer, demand, grants, REPLAY_AT).status).toBe("conditional");
    expect(matchOpportunity(offer, { ...demand, revision: "R2" }, grants, REPLAY_AT).status).toBe(
      "prohibited",
    );
    expect(
      matchOpportunity({ ...offer, supplierQualified: null }, demand, grants, REPLAY_AT).status,
    ).toBe("requires_review");
    expect(
      matchOpportunity(offer, { ...demand, status: "potential" }, grants, REPLAY_AT).status,
    ).toBe("requires_review");
    expect(
      matchOpportunity({ ...offer, committedQuantity: 90 }, demand, grants, REPLAY_AT).quantity,
    ).toBeNull();
  });
  it("revoked/expired grants and unknown specification do not become marketable matches", () => {
    expect(
      matchOpportunity(
        offer,
        demand,
        [{ ...grants[0], expiresAt: REPLAY_AT }, grants[1]],
        REPLAY_AT,
      ).quantity,
    ).toBeNull();
    expect(
      matchOpportunity({ ...offer, specification: null }, demand, grants, REPLAY_AT).status,
    ).toBe("requires_review");
  });
});
const workflow: Workflow = {
  kind: "order_acceptance",
  phase: "awaiting_approval",
  actionId: "a",
  inputDigest: "input",
  decisionDigest: "decision",
  requiredAuthorities: ["commercial", "safety"],
  proposedBy: "author",
  approvedBy: null,
  approvedAt: null,
  executionRef: null,
  executedAt: null,
  result: "unverified",
  outcomeEvidenceId: null,
};
describe("internal authorization and transaction lifecycle", () => {
  it("administration alone cannot approve and an author cannot self-approve", () => {
    expect(() =>
      approveWorkflow(
        workflow,
        { actorId: "admin", capabilities: ["read", "edit"], now: REPLAY_AT },
        "input",
        "decision",
      ),
    ).toThrow("CORE_AUTHORITY_DENIED");
    expect(() =>
      approveWorkflow(
        workflow,
        { actorId: "author", capabilities: ["commercial", "safety"], now: REPLAY_AT },
        "input",
        "decision",
      ),
    ).toThrow("CORE_INDEPENDENT_APPROVER_REQUIRED");
  });
  it("stale inputs and decision revisions invalidate approval", () => {
    expect(() =>
      approveWorkflow(
        workflow,
        { actorId: "reviewer", capabilities: ["commercial", "safety"], now: REPLAY_AT },
        "changed",
        "decision",
      ),
    ).toThrow("CORE_STALE_APPROVAL");
  });
  it("fails closed if authority is revoked before execution", async () => {
    await expect(
      executeWorkflow(
        { ...workflow, phase: "approved", approvedBy: "reviewer" },
        { actorId: "operator", capabilities: ["edit"], now: REPLAY_AT },
        "key",
        [],
        {
          mode: "internal-synthetic-only",
          async execute() {
            throw new Error("must not execute");
          },
        },
      ),
    ).rejects.toThrow("CORE_APPROVAL_AUTHORITY_REVOKED");
  });
  it.each(transactionKind.options)(
    "supports %s internal states with no external transaction",
    async (kind) => {
      const approved = { ...workflow, kind, phase: "approved" as const, approvedBy: "reviewer" };
      const result = await executeWorkflow(
        approved,
        { actorId: "operator", capabilities: ["edit"], now: REPLAY_AT },
        "key",
        ["commercial", "safety"],
        {
          mode: "internal-synthetic-only",
          async execute() {
            return { reference: "internal-only" };
          },
        },
      );
      expect(result.phase).toBe(kind === "payment_status" ? "awaiting_provider" : "completed");
      expect(result.result).toBe("unverified");
    },
  );
  it("retains failed execution without inventing a success or actual outcome", async () => {
    const result = await executeWorkflow(
      { ...workflow, phase: "approved", approvedBy: "reviewer" },
      { actorId: "operator", capabilities: ["edit"], now: REPLAY_AT },
      "key",
      ["commercial", "safety"],
      {
        mode: "internal-synthetic-only",
        async execute() {
          throw new Error("interrupted");
        },
      },
    );
    expect(result.phase).toBe("failed");
    expect(result.result).toBe("inconclusive");
  });
});

it("instantiates only new synthetic templates at a durable explicit clock", () => {
  const at = "2030-01-01T12:00:00.000Z";
  const input = instantiateFixture("A", 1, 1, at);
  expect(input.syntheticClock).toEqual({ templateAsOf: REPLAY_AT, instantiatedAt: at });
  expect(input.evidence[0].digest).toBe(fixture("A").evidence[0].digest);
  expect(evaluate(input, at).alternatives[0].status).toBe("eligible");
  expect(evaluate(fixture("A"), at).recommendation).toBeNull();
  expect(fixture("A").asOf).toBe(REPLAY_AT);
  expect(evaluate(input, "2030-01-02T12:00:00.000Z").recommendation).toBeNull();
});
