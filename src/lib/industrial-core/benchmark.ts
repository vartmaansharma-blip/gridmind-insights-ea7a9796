import { REPLAY_AT } from "./fixtures";
import { physicalFixture, runPhysicalScenario, type PhysicalSnapshot } from "./physical";
import type { CoreInput } from "./model";

/**
 * GM-MVP-004: seven fixed FICTIONAL cases compared with a readable
 * spreadsheet-style baseline. This is an engineering parity/safety test,
 * NOT a customer performance experiment or a validated faster/better claim.
 */
export const benchmarkScenarioIds = [
  "normal",
  "machine_stop",
  "panel_alarm",
  "suspected_fault",
  "owner_machine_conflict",
  "owner_avoid_feasible",
  "owner_inferred",
] as const;
export type BenchmarkScenario = (typeof benchmarkScenarioIds)[number];
type Exposure = "none" | "confirmed_stop" | "possible_exposure";
type Decision = "candidate_requires_review" | "hold_for_review";
type Preference = "none" | "confirmed_conflict" | "unconfirmed";
type Expected = {
  affectedOrders: string[];
  exposure: Exposure;
  decision: Decision;
  owner: Preference;
};

// Locked adjudication sheet derived only from the declared fictional
// scenario contract, not from evaluated GridMind outputs or customer records.
// A future blind assessment MUST use independent domain-labeled evidence.
const expected: Record<BenchmarkScenario, Expected> = {
  normal: { affectedOrders: [], exposure: "none", decision: "candidate_requires_review", owner: "none" },
  machine_stop: { affectedOrders: ["order"], exposure: "confirmed_stop", decision: "hold_for_review", owner: "none" },
  panel_alarm: { affectedOrders: ["order", "second-order"], exposure: "possible_exposure", decision: "hold_for_review", owner: "none" },
  suspected_fault: { affectedOrders: ["order", "second-order"], exposure: "possible_exposure", decision: "hold_for_review", owner: "none" },
  owner_machine_conflict: { affectedOrders: ["order"], exposure: "confirmed_stop", decision: "hold_for_review", owner: "confirmed_conflict" },
  owner_avoid_feasible: { affectedOrders: [], exposure: "none", decision: "hold_for_review", owner: "confirmed_conflict" },
  owner_inferred: { affectedOrders: [], exposure: "none", decision: "candidate_requires_review", owner: "unconfirmed" },
};
function sorted(ids: string[]) {
  return [...new Set(ids)].sort();
}
function equalArray(a: string[], b: string[]) {
  return JSON.stringify(sorted(a)) === JSON.stringify(sorted(b));
}
/**
 * Comparable sheet method: join resource -> operation -> routing -> work order
 * -> customer order; trace directed power dependencies. No GridMind evaluator.
 * The sheet conservatively requires a human check for causes, constraints,
 * owner conflicts and authorizations. It never approves a manufacturing act.
 */
export function spreadsheetBaseline(core: CoreInput, snapshot: PhysicalSnapshot): Expected {
  const byId = new Map(snapshot.nodes.map((node) => [node.id, node]));
  const incident = snapshot.incident;
  const exposedNodeIds = new Set<string>();
  if (incident) {
    const pending = [incident.subjectNodeId];
    while (pending.length) {
      const id = pending.shift()!;
      if (exposedNodeIds.has(id)) continue;
      exposedNodeIds.add(id);
      if (incident.type === "machine_stop") continue;
      for (const edge of snapshot.links) {
        if (edge.kind === "power_feed" && edge.from === id) pending.push(edge.to);
      }
    }
  }
  const machines = [...exposedNodeIds]
    .map((id) => byId.get(id))
    .filter((n) => n?.kind === "machine" && !!n.coreResourceId);
  const orders = new Set<string>();
  for (const machine of machines) {
    const operations = core.entities.filter((e) =>
      e.kind === "operation" && e.attributes.resourceId === machine?.coreResourceId);
    const operationIds = new Set(operations.map((o) => o.id));
    for (const routing of core.entities.filter((e) =>
      e.kind === "routing" &&
      (e.attributes.operationIds as string[]).some((id) => operationIds.has(id)))) {
      for (const workOrder of core.entities.filter((e) =>
        e.kind === "work_order" && e.attributes.routingId === routing.id)) {
        const order = core.entities.find((e) =>
          e.kind === "order" && e.id === workOrder.attributes.orderId);
        if (order) orders.add(order.id);
      }
    }
  }
  const ownerGoal = core.ownerIntents?.[0];
  const owner = !ownerGoal ? "none"
    : ownerGoal.status !== "confirmed" ? "unconfirmed"
    : incident?.type === "machine_stop" && ownerGoal.preference === "favor" ||
      !incident && ownerGoal.preference === "avoid"
      ? "confirmed_conflict" : "none";
  const incidentIsConfirmedStop = !!incident &&
    incident.type === "machine_stop" &&
    incident.observation === "verified" &&
    core.evidence.every((e) => e.verification === "verified" &&
      Date.parse(e.expiresAt) > Date.parse(REPLAY_AT));
  const exposure: Exposure = !incident ? "none"
    : incidentIsConfirmedStop ? "confirmed_stop" : "possible_exposure";
  const decision: Decision = incident || owner === "confirmed_conflict"
    ? "hold_for_review" : "candidate_requires_review";
  return { affectedOrders: sorted([...orders]), exposure, decision, owner };
}
function actualFromGridMind(scenario: BenchmarkScenario): Expected {
  const result = runPhysicalScenario(scenario);
  const affectedOrders = sorted(result.impacts.flatMap((i) =>
    i.orders.map((o) => o.orderId)));
  const exposure: Exposure = !result.incident ? "none"
    : result.impacts.some((i) => i.exposure === "confirmed_machine_unavailable")
      ? "confirmed_stop" : "possible_exposure";
  const owner: Preference = result.decision.ownerIntentAssessment?.conflicts.length
    ? "confirmed_conflict"
    : result.decision.ownerIntentAssessment?.inferredGoalsRequireConfirmation.length
      ? "unconfirmed" : "none";
  const decision: Decision = result.recommendedActionId
    ? "candidate_requires_review" : "hold_for_review";
  return { affectedOrders, exposure, decision, owner };
}
function matches(a: Expected, b: Expected) {
  return equalArray(a.affectedOrders, b.affectedOrders) &&
    a.exposure === b.exposure && a.decision === b.decision && a.owner === b.owner;
}
export function runSyntheticParityBenchmark() {
  const cases = benchmarkScenarioIds.map((id) => {
    const { core, snapshot } = physicalFixture(id);
    const spreadsheet = spreadsheetBaseline(core, snapshot);
    const gridmind = actualFromGridMind(id);
    const truth = expected[id];
    return {
      scenario: id,
      source: "invented_fixture" as const,
      truth,
      spreadsheet,
      gridmind,
      spreadsheetMatchesLockedFixture: matches(spreadsheet, truth),
      gridmindMatchesLockedFixture: matches(gridmind, truth),
      gridmindVsSpreadsheetAgreement: matches(gridmind, spreadsheet),
      unsafeAutonomousActions: 0 as const,
    };
  });
  return {
    schemaVersion: "gm-mvp-004-benchmark/v1" as const,
    scope: "seven_publicly_non_identifiable_synthetic_scenarios" as const,
    comparisonMethod: "rule_based_spreadsheet_style_reference_not_observed_factory_staff" as const,
    cases,
    metrics: {
      cases: cases.length,
      gridmindLockedFixturePass: cases.filter((x) => x.gridmindMatchesLockedFixture).length,
      spreadsheetLockedFixturePass: cases.filter((x) => x.spreadsheetMatchesLockedFixture).length,
      agreementCount: cases.filter((x) => x.gridmindVsSpreadsheetAgreement).length,
      accuracyOnRealFactoryCases: null,
      actualBaselineTimeMinutes: null,
      actualGridMindTimeMinutes: null,
      economicLiftRupees: null,
      realCustomerValidation: false,
      superiorToIncumbent: "not_established" as const,
    },
    verdict: cases.every((x) => x.gridmindMatchesLockedFixture &&
      x.spreadsheetMatchesLockedFixture)
      ? "synthetic_parity_only" as const : "synthetic_benchmark_defect" as const,
  };
}

/**
 * Authentic public-data sources are catalogued without importing or
 * masquerading as factory orders. Their source license and limitations
 * must accompany a later separate, opt-in data-processing benchmark.
 */
export const publicDatasetCandidates = [
  {
    id: "UCI-METROPT-3",
    sourceUrl: "https://archive.ics.uci.edu/dataset/791/metropt+3+dataset",
    doi: "10.24432/C5VW3R",
    license: "CC BY 4.0",
    origin: "real_public_equipment_data" as const,
    scope: "railway_compressor_signals_and_reported_fault_windows" as const,
    publishedInstanceCount: 1516948,
    processedRowsHere: 0,
    containsManufacturingOrders: false,
    containsApprovedAlternativeRouting: false,
    permitsCustomerDecisionClaims: false,
  },
  {
    id: "UCI-SECOM",
    sourceUrl: "https://archive.ics.uci.edu/dataset/179/secom",
    doi: "10.24432/C54305",
    license: "CC BY 4.0",
    origin: "real_public_quality_measurements" as const,
    scope: "anonymized_semiconductor_yield_measurements" as const,
    publishedInstanceCount: 1567,
    processedRowsHere: 0,
    containsManufacturingOrders: false,
    containsApprovedAlternativeRouting: false,
    permitsCustomerDecisionClaims: false,
  },
] as const;
