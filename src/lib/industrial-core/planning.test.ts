import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { REPLAY_AT } from "./fixtures";
import { inputSchema } from "./model";
import { planOperations, operatingPlanSchema, type ScheduledTask } from "./planning";
import { planningFixture, runPlanningScenario } from "./planning-fixtures";

const record = (input: ReturnType<typeof planningFixture>["input"], id: string) =>
  input.entities.find((e) => e.id === id)!;
const issues = (result: Awaited<ReturnType<typeof planOperations>>) =>
  result.jobs.flatMap((j) => j.issues.map((i) => i.code));
const exclusive = (tasks: ScheduledTask[]) => {
  const resources = (task: ScheduledTask) => [task.resourceId, ...task.toolIds, ...task.laborIds];
  for (let i = 0; i < tasks.length; i++)
    for (let j = i + 1; j < tasks.length; j++)
      if (resources(tasks[i]).some((key) => resources(tasks[j]).includes(key)))
        expect(
          Date.parse(tasks[i].endsAt) <= Date.parse(tasks[j].startsAt) ||
            Date.parse(tasks[j].endsAt) <= Date.parse(tasks[i].startsAt),
        ).toBe(true);
};
const noScalarCapacityRule = (input: ReturnType<typeof planningFixture>["input"]) => {
  input.constraints = input.constraints.filter((r) => r.id !== "capacity");
  for (const action of input.actions)
    action.requiredRuleIds = action.requiredRuleIds.filter((key) => key !== "capacity");
};
describe("GM-OPERATIONS-001 bounded finite planning", () => {
  it("plans two orders sharing machine, qualified labor and tooling, including every setup", async () => {
    const result = await runPlanningScenario("normal");
    expect(result.status).toBe("candidate_feasible");
    expect(result.tasks.map((t) => t.workOrderId)).toEqual(["work-order", "work-order-second"]);
    expect(result.tasks.map((t) => [t.startsAt, t.endsAt])).toEqual([
      [REPLAY_AT, "2026-10-20T14:10:00.000Z"],
      ["2026-10-20T14:10:00.000Z", "2026-10-20T16:20:00.000Z"],
    ]);
    expect(result.inventoryRemaining).toEqual([
      { lotId: "lot", unit: "kg", uncommitted: 100, reservedForOrders: 0 },
    ]);
    expect(result.approval).toBe("required_before_assignment");
    expect(result.optimality).toBe("not_claimed");
    exclusive(result.tasks);
  });
  it("binds the expanded fictional operating records to their actual source bytes", async () => {
    const source = readFileSync(
      new URL("../../../data/industrial-core/planning-source.txt", import.meta.url),
    );
    const actual = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", source)), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
    expect(planningFixture().input.evidence.find((e) => e.id === "planning-source")!.digest).toBe(
      actual,
    );
  });
  it("preserves original sources and yields stable exact input/plan digests", async () => {
    const { input, plan } = planningFixture(),
      original = structuredClone({ input, plan });
    const a = await planOperations(input, plan, REPLAY_AT),
      b = await planOperations(input, plan, REPLAY_AT);
    expect(a).toEqual(b);
    expect({ input, plan }).toEqual(original);
    expect(a.inputDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(a.planDigest).toMatch(/^[a-f0-9]{64}$/);
  });
  it("never double allocates inventory or exclusive resources across a range of quantities", async () => {
    for (const amount of [1, 7, 30, 79, 100, 120]) {
      const { input, plan } = planningFixture();
      for (const key of ["order", "order-second", "work-order", "work-order-second"])
        record(input, key).attributes.quantity = amount;
      for (const job of plan.jobs) job.allocations[0].quantity = amount;
      const result = await planOperations(input, plan, REPLAY_AT);
      expect(result.status).toBe("candidate_feasible");
      exclusive(result.tasks);
      const consumed = result.jobs
        .flatMap((j) => j.allocations)
        .reduce((sum, allocation) => sum + allocation.quantity, 0);
      expect(
        consumed +
          result.inventoryRemaining[0].uncommitted +
          result.inventoryRemaining[0].reservedForOrders,
      ).toBe(300);
      expect(
        result.inventoryRemaining.every((l) => l.uncommitted >= 0 && l.reservedForOrders >= 0),
      ).toBe(true);
    }
  });
  it("protects other orders' reservations and returns a real shortage without negative stock", async () => {
    const result = await runPlanningScenario("shortage");
    expect(result.jobs.map((j) => j.status)).toEqual(["candidate", "blocked"]);
    expect(issues(result)).toContain("MATERIAL_SHORTAGE_OR_ALREADY_RESERVED");
    expect(result.tasks).toHaveLength(1);
    expect(result.inventoryRemaining[0].uncommitted).toBe(50);
  });
  it("atomically rolls back a failed job's stock and capacity before considering the next order", async () => {
    const { input, plan } = planningFixture("shortage");
    plan.jobs.find((j) => j.workOrderId === "work-order")!.steps[0].candidates[0].resourceId =
      "missing-press";
    const result = await planOperations(input, plan, REPLAY_AT);
    expect(result.jobs.map((j) => j.status)).toEqual(["blocked", "candidate"]);
    expect(result.tasks[0].startsAt).toBe(REPLAY_AT);
    expect(result.inventoryRemaining[0]).toEqual({
      lotId: "lot",
      unit: "kg",
      uncommitted: 0,
      reservedForOrders: 50,
    });
  });
  it("excludes a cheaper unapproved origin using the actual verified rule", async () => {
    const { input, plan } = planningFixture();
    record(input, "lot").attributes.producerId = "alternative-producer";
    record(input, "steel").attributes.producerId = "alternative-producer";
    for (const action of input.actions) action.facts.producer!.value = "alternative-producer";
    const result = await planOperations(input, plan, REPLAY_AT);
    expect(result.tasks).toHaveLength(0);
    expect(issues(result)).toContain("MANDATORY_REQUIREMENT_FAILED");
  });
  it("refuses held inspections even if a lot itself still says released", async () => {
    const result = await runPlanningScenario("quality_hold");
    expect(result.tasks).toHaveLength(0);
    expect(issues(result)).toContain("MATERIAL_NOT_QUALITY_RELEASED");
  });
  it("never assumes a stopped machine has returned to service", async () => {
    const result = await runPlanningScenario("breakdown");
    expect(result.tasks).toHaveLength(0);
    expect(issues(result)).toContain("DOWNTIME_REQUIRES_VERIFIED_RETURN_TO_SERVICE");
    const { input, plan } = planningFixture();
    plan.unavailable.push({
      id: "observed-stop",
      resourceId: "press",
      startsAt: REPLAY_AT,
      endsAt: "2026-10-20T12:10:00.000Z",
      reason: "observed_downtime",
      evidenceIds: ["source"],
    });
    expect((await planOperations(input, plan, REPLAY_AT)).tasks).toHaveLength(0);
  });
  it("respects planned maintenance windows and does not double count overlapping blocks", async () => {
    const { input, plan } = planningFixture();
    for (const [id, end] of [
      ["maintenance-a", "12:30"],
      ["maintenance-b", "13:00"],
    ])
      plan.unavailable.push({
        id,
        resourceId: "press",
        startsAt: REPLAY_AT,
        endsAt: `2026-10-20T${end}:00.000Z`,
        reason: "planned_maintenance",
        evidenceIds: ["source"],
      });
    const result = await planOperations(input, plan, REPLAY_AT);
    expect(result.tasks[0].startsAt).toBe("2026-10-20T13:00:00.000Z");
    exclusive(result.tasks);
  });
  it("waits for a qualified operator's real calendar and rejects unlocated breaks", async () => {
    const { input, plan } = planningFixture();
    Object.assign(record(input, "operator-shift").attributes, {
      startsAt: "2026-10-20T13:00:00.000Z",
      availableMinutes: 420,
    });
    expect((await planOperations(input, plan, REPLAY_AT)).tasks[0].startsAt).toBe(
      "2026-10-20T13:00:00.000Z",
    );
    const unknown = await runPlanningScenario("calendar_unknown");
    expect(unknown.tasks).toHaveLength(0);
    expect(issues(unknown)).toContain("CALENDAR_BREAKS_NOT_LOCATED");
  });
  it("requires labor/tool process qualifications instead of trusting asserted action facts", async () => {
    const { input, plan } = planningFixture();
    record(input, "operator-qualification").attributes.verification = "proposed";
    const result = await planOperations(input, plan, REPLAY_AT);
    expect(result.tasks).toHaveLength(0);
    expect(issues(result)).toContain("RESOURCE_QUALIFICATION_MISSING");
  });
  it("reports outsourced delay and the affected order without occupying capacity it cannot use", async () => {
    const result = await runPlanningScenario("outsourced_delay");
    expect(result.jobs.find((j) => j.orderId === "order")?.status).toBe("blocked");
    expect(result.jobs.find((j) => j.orderId === "order-second")?.status).toBe("candidate");
    expect(result.tasks[0].startsAt).toBe(REPLAY_AT);
  });
  it("does not override a confirmed owner's avoidance preference or invent confirmation", async () => {
    expect((await runPlanningScenario("owner_conflict")).status).toBe("blocked_or_requires_review");
    const { input, plan } = planningFixture("owner_conflict");
    input.ownerIntents![0].source = "inferred";
    input.ownerIntents![0].status = "proposed";
    input.ownerIntents![0].confirmedBy = null;
    expect(
      (await planOperations(input, plan, REPLAY_AT)).ownerIntentAssessment
        .inferredGoalsRequireConfirmation,
    ).toEqual(["owner-avoid"]);
  });
  it("never skips a binding scalar capacity restriction", async () => {
    const { input, plan } = planningFixture();
    input.constraints.find((r) => r.id === "capacity")!.condition.value = 600;
    const result = await planOperations(input, plan, REPLAY_AT);
    expect(result.tasks).toHaveLength(0);
    expect(issues(result)).toContain("MANDATORY_REQUIREMENT_FAILED");
  });
  it("requires current rules, inventory releases and resources through each planned operation", async () => {
    for (const change of [
      (s: ReturnType<typeof planningFixture>["input"]) => {
        s.constraints.find((r) => r.id === "safety")!.expiresAt = "2026-10-20T13:00:00.000Z";
      },
      (s: ReturnType<typeof planningFixture>["input"]) => {
        record(s, "inspection").validUntil = "2026-10-20T13:00:00.000Z";
      },
      (s: ReturnType<typeof planningFixture>["input"]) => {
        record(s, "operator-qualification").validUntil = "2026-10-20T13:00:00.000Z";
      },
    ]) {
      const { input, plan } = planningFixture();
      change(input);
      expect((await planOperations(input, plan, REPLAY_AT)).tasks).toHaveLength(0);
    }
  });
  it("refuses stale, unverified or future evidence without refreshing the clock", async () => {
    for (const value of ["unverified", "future"] as const) {
      const { input, plan } = planningFixture();
      if (value === "unverified") input.evidence[0].verification = "unverified";
      else input.evidence[0].observedAt = "2026-10-20T13:00:00.000Z";
      expect((await planOperations(input, plan, REPLAY_AT)).tasks).toHaveLength(0);
    }
  });
  it("does not overlook active work orders or count two aliases of one asset as capacity", async () => {
    const { input, plan } = planningFixture();
    plan.jobs.pop();
    expect(issues(await planOperations(input, plan, REPLAY_AT))).toContain(
      "UNPLANNED_WORK_ORDERS_REQUIRE_SCOPE_REVIEW",
    );
    const other = planningFixture();
    record(other.input, "press").attributes.assetRef = 77;
    record(other.input, "tool").attributes.assetRef = 77;
    expect(issues(await planOperations(other.input, other.plan, REPLAY_AT))).toContain(
      "AMBIGUOUS_DUPLICATE_ASSET_IDENTITY",
    );
  });
  it("rejects non-integral base quantities, mismatched reservations and units", async () => {
    for (const change of [
      (s: ReturnType<typeof planningFixture>["input"]) => {
        record(s, "lot").attributes.quantity = 300.5;
      },
      (s: ReturnType<typeof planningFixture>["input"]) => {
        record(s, "reservation").attributes.quantity = 20;
      },
      (s: ReturnType<typeof planningFixture>["input"]) => {
        record(s, "lot").attributes.unit = "gram";
      },
    ]) {
      const { input, plan } = planningFixture();
      change(input);
      expect((await planOperations(input, plan, REPLAY_AT)).tasks).toHaveLength(0);
    }
  });
  it("prevents cross-plant allocation and cross-tenant input ownership", async () => {
    const { input, plan } = planningFixture();
    record(input, "plant").attributes.factoryRef = 999;
    expect(issues(await planOperations(input, plan, REPLAY_AT))).toContain(
      "RESOURCE_OUTSIDE_PLANT",
    );
    record(input, "lot").ownerOrganizationId = 999;
    expect(inputSchema.safeParse(input).success).toBe(false);
  });
  it("follows operation precedence and explicitly identifies unsupported scalar multi-resource rules", async () => {
    const { input, plan } = planningFixture();
    input.entities = input.entities.filter(
      (e) => !["order-second", "work-order-second"].includes(e.id),
    );
    input.actions.pop();
    plan.jobs = plan.jobs.filter((j) => j.workOrderId === "work-order");
    input.entities.push({
      ...structuredClone(record(input, "operation")),
      id: "finish",
      attributes: { ...record(input, "operation").attributes, predecessorIds: ["operation"] },
    });
    record(input, "routing").attributes.operationIds = ["operation", "finish"];
    input.actions[0].operationIds = ["operation", "finish"];
    plan.jobs[0].steps.unshift({
      ...structuredClone(plan.jobs[0].steps[0]),
      operationId: "finish",
    });
    expect(issues(await planOperations(input, plan, REPLAY_AT))).toContain(
      "MULTI_RESOURCE_SCALAR_CAPACITY_RULE_REQUIRES_REVIEW",
    );
    noScalarCapacityRule(input);
    const result = await planOperations(input, plan, REPLAY_AT);
    expect(result.tasks.map((t) => t.operationId)).toEqual(["operation", "finish"]);
    expect(result.tasks[1].startsAt).toBe(result.tasks[0].endsAt);
    exclusive(result.tasks);
  });
  it("rejects duplicate jobs/allocations, impossible horizons and non-synthetic origin", () => {
    const { plan } = planningFixture();
    expect(
      operatingPlanSchema.safeParse({ ...plan, jobs: [plan.jobs[0], plan.jobs[0]] }).success,
    ).toBe(false);
    expect(operatingPlanSchema.safeParse({ ...plan, endsAt: plan.startsAt }).success).toBe(false);
    expect(operatingPlanSchema.safeParse({ ...plan, origin: "customer" }).success).toBe(false);
  });
});

it("replays saved planning bytes and refuses altered tasks or a stale input binding", async () => {
  const { parseState } = await import("./service");
  const { digest } = await import("./engine");
  const { input, plan } = planningFixture();
  const inputDigest = await digest(input);
  const state = {
    origin: "synthetic",
    input,
    inputEditor: "11111111-1111-4111-8111-111111111111",
    inputDigest,
    evaluation: null,
    decisionDigest: null,
    workflow: null,
    operations: {
      specification: plan,
      basedOnInputDigest: inputDigest,
      evaluation: await planOperations(input, plan, REPLAY_AT),
    },
  };
  expect((await parseState(state)).operations!.evaluation!.status).toBe("candidate_feasible");
  const forged = structuredClone(state);
  forged.operations.evaluation.tasks[0].quantity = 999;
  await expect(parseState(forged)).rejects.toThrow("CORE_OPERATING_PLAN_INTEGRITY_FAILED");
  const stale = structuredClone(state);
  stale.operations.basedOnInputDigest = "0".repeat(64);
  await expect(parseState(stale)).rejects.toThrow("CORE_OPERATING_PLAN_INTEGRITY_FAILED");
});
it("does not treat an expired owner statement as permission", async () => {
  const { input, plan } = planningFixture("owner_conflict");
  input.ownerIntents![0].effectiveFrom = "2026-10-20T11:00:00.000Z";
  input.ownerIntents![0].expiresAt = REPLAY_AT;
  const result = await planOperations(input, plan, REPLAY_AT);
  expect(result.ownerIntentAssessment.summaries[0].state).toBe("stale");
  expect(result.status).toBe("blocked_or_requires_review");
});
