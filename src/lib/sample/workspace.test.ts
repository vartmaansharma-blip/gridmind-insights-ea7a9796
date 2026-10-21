import { describe, it, expect } from "vitest";
import {
  createSampleWorkspace,
  applySampleCommand,
  entity,
  records,
  linkedOrders,
  latestDecision,
  samplePlan,
  exportSample,
  validateSample,
  productProcess,
  machineStopped,
  type SampleWorkspace,
} from "./workspace";
const machine = {
  type: "machine",
  id: "press-03",
  label: "Press 03",
  lineId: "line-one",
  processId: "stamping",
  editing: false,
} as const;
const order = {
  type: "order",
  id: "order-03",
  productId: "part",
  machineId: "press-03",
  lotId: "lot",
  quantity: 20,
} as const;
async function journey() {
  let s = createSampleWorkspace();
  s = await applySampleCommand(s, machine);
  s = await applySampleCommand(s, order);
  s = await applySampleCommand(s, {
    type: "incident",
    kind: "machine_stop",
    subjectId: "press-03",
    title: "Press 03 stopped",
  });
  return applySampleCommand(s, { type: "evaluate", caseId: s.cases[0].id });
}
describe("GM-EXPLORE-001 one connected sample organization", () => {
  it("initializes deterministically with scoped persona, two presses and a feasible shared-resource plan", async () => {
    const s = createSampleWorkspace();
    expect(s).toEqual(createSampleWorkspace());
    expect(s.profile.organization).toBe("GridMind Example Components");
    expect(s.persona.organizationId).toBe(s.core.organizationId);
    expect(s.persona.factoryId).toBe(s.core.factoryId);
    expect(s.persona.realAuthorization).toBe(false);
    expect((await samplePlan(s)).status).toBe("candidate_feasible");
    expect(records(s, "work_order")).toHaveLength(2);
  });
  it("completes registration → order → scoped stoppage → real alternatives → simulated review → history/export", async () => {
    let s = await journey();
    const c = s.cases[0];
    expect(c.orderIds).toEqual(["order-03"]);
    expect(c.evaluations[0].physical.impacts[0].orders.map((o) => o.orderId)).toEqual(["order-03"]);
    expect(c.evaluations[0].alternatives).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ resourceId: "press", eligible: true }),
        expect.objectContaining({ resourceId: "press-03", eligible: false }),
      ]),
    );
    expect(c.evaluations[0].plan.jobs.find((j) => j.orderId === "second-order")!.status).toBe(
      "candidate",
    );
    s = await applySampleCommand(s, {
      type: "review",
      caseId: c.id,
      decision: "approve_for_simulation",
      note: "Review candidate on available Press 01",
    });
    s = await applySampleCommand(s, {
      type: "outcome",
      caseId: c.id,
      kind: "simulated",
      note: "Illustration only; no actual production",
    });
    expect(s.cases[0].reviews[0].realAuthorization).toBe(false);
    expect(s.cases[0].outcome!.kind).toBe("simulated");
    const report = await exportSample(s);
    expect(report.classification).toBe("SYNTHETIC");
    expect(report.actualObservedData).toBe(false);
    expect(report.verifiedSavings).toBeNull();
    expect(report.workspace.timeline.map((e) => e.action)).toEqual([
      "initialized",
      "machine",
      "order",
      "incident",
      "evaluate",
      "review",
      "outcome",
    ]);
    expect(s.cases[0].evaluations[0].input.entities.some((e) => e.id === "press-03")).toBe(true);
  });
  it("rejects duplicates, unknown/wrong references and incompatible routes atomically", async () => {
    const s = await applySampleCommand(createSampleWorkspace(), machine),
      before = structuredClone(s);
    await expect(applySampleCommand(s, machine)).rejects.toThrow("already exists");
    await expect(applySampleCommand(s, { ...order, machineId: "press-second" })).rejects.toThrow(
      "incompatible",
    );
    await expect(applySampleCommand(s, { ...order, lotId: "missing" })).rejects.toThrow("missing");
    await expect(applySampleCommand(s, { ...order, lotId: "second-lot" })).rejects.toThrow("BOM");
    await expect(
      applySampleCommand(s, { ...machine, id: "other", lineId: "line-two" }),
    ).rejects.toThrow("line does not support");
    expect(s).toEqual(before);
  });
  it("moves unused machines with topology/capability changes and blocks destructive referenced deletion", async () => {
    let s = await applySampleCommand(createSampleWorkspace(), machine);
    s = await applySampleCommand(s, {
      ...machine,
      editing: true,
      processId: "second-process",
      lineId: "line-two",
      label: "Moved press",
    });
    expect(entity(s, "press-03").attributes.processIds).toEqual(["second-process"]);
    const node = s.physical.nodes.find((n) => n.coreResourceId === "press-03")!;
    expect(
      s.physical.links.find((l) => l.from === node.id && l.kind === "line_membership")!.to,
    ).toBe("line-b");
    s = await applySampleCommand(s, { type: "remove_machine", id: "press-03" });
    expect(s.core.entities.some((e) => e.id === "press-03")).toBe(false);
    await expect(applySampleCommand(s, { type: "remove_machine", id: "press" })).rejects.toThrow(
      "referenced",
    );
  });
  it("cannot strip a process capability required by connected work orders", async () => {
    await expect(
      applySampleCommand(createSampleWorkspace(), {
        ...machine,
        id: "press",
        editing: true,
        lineId: "line-two",
        processId: "second-process",
      }),
    ).rejects.toThrow("required by connected");
  });
  it("material shortages block approval while unrelated material orders retain their own result", async () => {
    let s = createSampleWorkspace();
    s = await applySampleCommand(s, {
      type: "incident",
      kind: "material_shortage",
      subjectId: "lot",
      title: "Steel unavailable",
    });
    s = await applySampleCommand(s, { type: "evaluate", caseId: s.cases[0].id });
    expect(s.cases[0].orderIds).toEqual(["order"]);
    expect(s.cases[0].evaluations[0].eligible).toBe(false);
    expect(
      s.cases[0].evaluations[0].plan.jobs.find((j) => j.orderId === "second-order")!.status,
    ).toBe("candidate");
    await expect(
      applySampleCommand(s, {
        type: "review",
        caseId: s.cases[0].id,
        decision: "approve_for_simulation",
        note: "Cannot bypass missing stock",
      }),
    ).rejects.toThrow("No eligible");
  });
  it("quality hold consumes no held stock and preserves the explicit release barrier", async () => {
    let s = await applySampleCommand(createSampleWorkspace(), {
      type: "incident",
      kind: "quality_hold",
      subjectId: "lot",
      title: "Inspection uncertainty",
    });
    s = await applySampleCommand(s, { type: "evaluate", caseId: s.cases[0].id });
    expect(
      s.cases[0].evaluations[0].plan.jobs
        .find((j) => j.orderId === "order")!
        .issues.map((i) => i.code),
    ).toContain("MATERIAL_NOT_QUALITY_RELEASED");
  });
  it("electrical warning stays uncertain and never creates a verified machine failure", async () => {
    let s = await applySampleCommand(createSampleWorkspace(), {
      type: "incident",
      kind: "electrical_uncertainty",
      subjectId: "plant",
      title: "Panel warning",
    });
    s = await applySampleCommand(s, { type: "evaluate", caseId: s.cases[0].id });
    const e = s.cases[0].evaluations[0];
    expect(e.eligible).toBe(false);
    expect(e.physical.inferredCause).toBeNull();
    expect(e.physical.impacts.every((i) => i.exposure === "potentially_affected")).toBe(true);
    expect(records(s, "event").filter((e) => e.attributes.eventType === "downtime")).toEqual([]);
  });
  it("owner intent cannot silently override feasible manufacturing records", async () => {
    let s = await applySampleCommand(createSampleWorkspace(), {
      type: "incident",
      kind: "owner_conflict",
      subjectId: "order",
      title: "Owner asks to wait",
    });
    s = await applySampleCommand(s, { type: "evaluate", caseId: s.cases[0].id });
    expect(s.cases[0].evaluations[0].eligible).toBe(false);
    expect(s.cases[0].evaluations[0].plan.ownerIntentAssessment.conflicts.length).toBeGreaterThan(
      0,
    );
  });
  it("source changes invalidate decisions without destroying their evaluation/review history", async () => {
    let s = await journey();
    const id = s.cases[0].id;
    s = await applySampleCommand(s, {
      type: "review",
      caseId: id,
      decision: "defer",
      note: "Review next shift",
    });
    const original = structuredClone(s.cases[0].evaluations[0]);
    s = await applySampleCommand(s, { type: "stock", id: "lot", quantity: 280 });
    expect(latestDecision(s, s.cases[0]).stale).toBe(true);
    expect(s.cases[0].evaluations[0]).toEqual(original);
    expect(s.cases[0].reviews).toHaveLength(1);
    await expect(
      applySampleCommand(s, {
        type: "review",
        caseId: id,
        decision: "approve_for_simulation",
        note: "Old source",
      }),
    ).rejects.toThrow("Evaluate the current");
    await expect(
      applySampleCommand(s, { type: "outcome", caseId: id, kind: "simulated", note: "Old source" }),
    ).rejects.toThrow("current simulated");
  });
  it("creates linked products/BOMs/lots/routes and preserves exact base-unit consumption", async () => {
    let s = await applySampleCommand(createSampleWorkspace(), {
      type: "product",
      id: "bracket-new",
      label: "New bracket",
      materialId: "steel",
      processId: "stamping",
      perPart: 2,
    });
    s = await applySampleCommand(s, {
      type: "lot",
      id: "new-steel",
      materialId: "steel",
      quantity: 100,
    });
    s = await applySampleCommand(s, {
      ...order,
      id: "new-order",
      productId: "bracket-new",
      machineId: "press",
      lotId: "new-steel",
      quantity: 10,
    });
    expect(productProcess(s, "bracket-new")).toBe("stamping");
    const p = await samplePlan(s);
    expect(p.jobs.find((j) => j.orderId === "new-order")!.allocations).toEqual([
      { lotId: "new-steel", quantity: 20, unit: "kg" },
    ]);
    expect(p.status).toBe("candidate_feasible");
  });
  it("protects reserved stock and refuses cross-material reservations", async () => {
    let s = createSampleWorkspace();
    s = await applySampleCommand(s, {
      type: "reserve",
      lotId: "lot",
      orderId: "order",
      quantity: 20,
    });
    expect(entity(s, "lot").attributes.reserved).toBe(70);
    await expect(applySampleCommand(s, { type: "stock", id: "lot", quantity: 60 })).rejects.toThrow(
      "protected",
    );
    await expect(
      applySampleCommand(s, {
        type: "reserve",
        lotId: "lot",
        orderId: "second-order",
        quantity: 20,
      }),
    ).rejects.toThrow("selected material");
    expect((await samplePlan(s)).status).toBe("candidate_feasible");
  });
  it("explicit availability updates invalidate planning and never operate equipment", async () => {
    let s = createSampleWorkspace();
    s = await applySampleCommand(s, { type: "availability", id: "press", available: false });
    expect(machineStopped(s, "press")).toBe(true);
    expect((await samplePlan(s)).jobs.find((j) => j.orderId === "order")!.status).toBe("blocked");
    s = await applySampleCommand(s, { type: "availability", id: "press", available: true });
    expect(machineStopped(s, "press")).toBe(false);
    expect((await samplePlan(s)).status).toBe("candidate_feasible");
  });
  it("does not mutate the previous state, exposes independent instances and rejects foreign scope", async () => {
    const a = createSampleWorkspace(),
      b = createSampleWorkspace();
    const changed = await applySampleCommand(a, machine);
    expect(a).toEqual(b);
    expect(changed).not.toEqual(b);
    const foreign = structuredClone(a);
    foreign.persona.organizationId = 999;
    expect(() => validateSample(foreign)).toThrow("scope");
    expect(linkedOrders(a, "press")).toEqual(["order"]);
  });
});

it("binds initialization bytes and edited records to replayable source digests", async () => {
  const { readFile } = await import("node:fs/promises");
  const { createHash } = await import("node:crypto");
  const s = createSampleWorkspace();
  const bytes = await readFile("data/industrial-core/sample-organization-source.txt");
  expect(s.core.evidence.find((e) => e.id === "sample-template")?.digest).toBe(
    createHash("sha256").update(bytes).digest("hex"),
  );
  const next = await applySampleCommand(s, machine);
  const source = next.core.evidence.find((e) => e.id === "sample-source-1")!;
  expect(source.digest).toMatch(/^[a-f0-9]{64}$/);
  expect(next.core.entities.find((e) => e.id === "press-03")?.evidenceIds).toContain(source.id);
  expect(s.core.evidence.some((e) => e.id === source.id)).toBe(false);
  expect(next.core.entities.find((e) => e.id === "second-order")?.evidenceIds).not.toContain(
    source.id,
  );
});
