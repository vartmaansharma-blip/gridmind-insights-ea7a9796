import { describe, expect, it } from "vitest";
import { REPLAY_AT } from "./fixtures";
import {
  evaluatePhysicalSnapshot,
  physicalFixture,
  runPhysicalScenario,
} from "./physical";

describe("GM-MVP-002 physical asset/production decision bridge (synthetic only)", () => {
  it("reuses the existing industrial decision engine without changing eligibility in the normal case", () => {
    const r = runPhysicalScenario("normal");
    expect(r.decision.recommendation).toBe("produce-approved");
    expect(r.recommendedActionId).toBe("produce-approved");
    expect(r.impacts).toHaveLength(0);
    expect(r.topology).toHaveLength(8);
    expect(r.inferredCause).toBeNull();
    expect(r.customerValidated).toBe(false);
  });
  it("traces a verified stopped machine to its exact work order, part/material and decision", () => {
    const r = runPhysicalScenario("machine_stop");
    expect(r.impacts).toHaveLength(1);
    expect(r.impacts[0].resourceId).toBe("press");
    expect(r.impacts[0].orders.map((o) => o.orderId)).toEqual(["order"]);
    expect(r.impacts[0].orders[0].materialIds).toEqual(["steel"]);
    expect(r.decision.disruptionImpacts[0].affected.some((e) => e.id === "second-order")).toBe(false);
    expect(r.impacts[0].orders[0].workOrderIds).toEqual(["work-order"]);
    expect(r.impacts[0].exposure).toBe("confirmed_machine_unavailable");
    expect(r.decision.alternatives.find((x) => x.actionId === "produce-approved")?.checks)
      .toContainEqual(expect.objectContaining({ reason: "RESOURCE_UNAVAILABLE", status: "prohibited" }));
    expect(r.decision.recommendation).toBeNull();
    expect(r.recommendedActionId).toBeNull();
    expect(r.verifiedSavings).toBeNull();
    expect(r.authorizedMachineControl).toBe(false);
  });
  it("reports electrical exposure for both lines but never fabricates machine downtime or electrical causation", () => {
    const r = runPhysicalScenario("panel_alarm");
    expect(r.impacts).toHaveLength(2);
    expect(r.impacts.find((i) => i.resourceId === "press")?.orders.map((o) => o.orderId))
      .toEqual(["order"]);
    expect(r.impacts.find((i) => i.resourceId === "press-second")?.orders.map((o) => o.orderId))
      .toEqual(["second-order"]);
    expect(r.impacts.find((i) => i.resourceId === "press-second")?.orders[0].materialIds)
      .toEqual(["second-material"]);
    expect(r.impacts.every((i) => i.exposure === "potentially_affected")).toBe(true);
    expect(r.decision.alternatives.find((x) => x.actionId === "produce-approved")?.status)
      .toBe("eligible");
    expect(r.decisionReadiness).toBe("requires_fact_confirmation");
    expect(r.recommendedActionId).toBeNull();
    expect(r.inferredCause).toBeNull();
  });
  it("never promotes an unconfirmed power-fault suspicion to verified machine unavailability", () => {
    const r = runPhysicalScenario("suspected_fault");
    expect(r.impacts.length).toBe(2);
    expect(r.impacts.every((i) => i.exposure === "potentially_affected")).toBe(true);
    expect(r.recommendedActionId).toBeNull();
  });
  it("withholds recommendations for a reported or stale machine event", () => {
    const reported = physicalFixture("machine_stop");
    reported.snapshot.incident!.observation = "reported";
    const r = evaluatePhysicalSnapshot(reported.core, reported.snapshot, REPLAY_AT);
    expect(r.impacts[0].exposure).toBe("potentially_affected");
    expect(r.recommendedActionId).toBeNull();
    expect(r.decision.alternatives[0].status).toBe("eligible");

    const stale = physicalFixture("machine_stop");
    stale.core.evidence[0].expiresAt = REPLAY_AT;
    const e = evaluatePhysicalSnapshot(stale.core, stale.snapshot, REPLAY_AT);
    expect(e.impacts[0].exposure).toBe("potentially_affected");
    expect(e.recommendedActionId).toBeNull();
  });
  it("refuses foreign factories, nonexistent resources, fake source IDs and invalid power direction", () => {
    const foreign = physicalFixture("machine_stop");
    foreign.snapshot.organizationId = 999;
    expect(() => evaluatePhysicalSnapshot(foreign.core, foreign.snapshot, REPLAY_AT))
      .toThrow("PHYSICAL_TENANT_SCOPE_MISMATCH");

    const resource = physicalFixture("normal");
    resource.snapshot.nodes.find((x) => x.id === "machine-one")!.coreResourceId = "missing-machine";
    expect(() => evaluatePhysicalSnapshot(resource.core, resource.snapshot, REPLAY_AT))
      .toThrow("PHYSICAL_RESOURCE_BINDING_INVALID");

    const fakeSource = physicalFixture("normal");
    fakeSource.snapshot.links[0].evidenceIds = ["invented-proof"];
    expect(() => evaluatePhysicalSnapshot(fakeSource.core, fakeSource.snapshot, REPLAY_AT))
      .toThrow("PHYSICAL_MISSING_LINK_EVIDENCE");

    const badLink = physicalFixture("normal");
    badLink.snapshot.links[0].from = "machine-one";
    expect(() => evaluatePhysicalSnapshot(badLink.core, badLink.snapshot, REPLAY_AT))
      .toThrow("PHYSICAL_INVALID_POWER_DIRECTION");
  });
  it("rejects cyclic power topology and future observations", () => {
    const cycle = physicalFixture("panel_alarm");
    cycle.snapshot.links.push({
      id: "cycle", from: "panel", to: "transformer", kind: "power_feed",
      evidenceIds: ["source"], verification: "verified",
    });
    expect(() => evaluatePhysicalSnapshot(cycle.core, cycle.snapshot, REPLAY_AT))
      .toThrow("PHYSICAL_POWER_CYCLE");

    const future = physicalFixture("machine_stop");
    future.snapshot.incident!.at = "2026-10-20T13:00:00.000Z";
    expect(() => evaluatePhysicalSnapshot(future.core, future.snapshot, REPLAY_AT))
      .toThrow("PHYSICAL_FUTURE_INCIDENT");
  });
  it("does not mistake a proposed electrical connection for verified root-cause evidence", () => {
    const proposed = physicalFixture("panel_alarm");
    proposed.snapshot.links.find((x) => x.from === "panel" && x.to === "meter")!
      .verification = "proposed";
    const r = evaluatePhysicalSnapshot(proposed.core, proposed.snapshot, REPLAY_AT);
    expect(r.impacts.every((i) => i.exposure === "potentially_affected")).toBe(true);
    expect(r.inferredCause).toBeNull();
    expect(r.recommendedActionId).toBeNull();
  });
});
