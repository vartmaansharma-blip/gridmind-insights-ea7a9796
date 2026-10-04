import type { Factory, Opportunity } from "./types";
import type { Analysis } from "./analysis";

export type OpportunityClass =
  | "Excess normalized energy"
  | "Idle / off-hours consumption"
  | "Demand / capacity behavior"
  | "System / process deterioration"
  | "High-value evidence gap";

export type IntelligenceOpportunity = Opportunity & {
  opportunityClass: OpportunityClass;
  system: string;
  evidence: string[];
  reference: string;
  context: string;
  uncertainty: string;
  missingEvidence: string[];
  possibleExplanations: string[];
  financialState: "estimated" | "potential";
  verificationState: "not started" | "in progress" | "ready for review";
  evidenceState: "estimated" | "hypothesis" | "unknown";
};

const classFor = (o: Opportunity): OpportunityClass => {
  if (o.id === "sec-drift") return "Excess normalized energy";
  if (o.category === "demand") return "Demand / capacity behavior";
  if (o.id === "power-factor") return "System / process deterioration";
  return "High-value evidence gap";
};

const systemFor = (o: Opportunity) => {
  if (o.category === "demand" || o.id === "power-factor") return "Electrical distribution";
  if (o.id.includes("compressor")) return "Compressed air";
  if (o.id.includes("furnace")) return "Heat treatment";
  if (o.id.includes("hvac")) return "Process HVAC";
  return o.category === "process" ? "Production process" : "Plant utilities";
};

export function buildIntelligenceOpportunities(factory: Factory, analysis: Analysis): IntelligenceOpportunity[] {
  const n = analysis.rows.length;
  const mapped = analysis.opportunities.map((o): IntelligenceOpportunity => {
    const equipmentBased = o.category === "equipment";
    const state = factory.opportunityStatus[o.id] ?? "open";
    return {
      ...o,
      opportunityClass: classFor(o),
      system: systemFor(o),
      evidence: equipmentBased
        ? ["Equipment nameplate, quantity, assumed load factor and monthly operating hours", "Factory-level electricity bills"]
        : o.id === "sec-drift"
          ? [`${n} monthly bill and production records`, `Plant reference: ${analysis.baselineSec.toFixed(3)} kWh/${factory.productUnit}`]
          : [`${n} monthly electricity records`, `Contract demand: ${factory.contractDemandKva.toLocaleString("en-IN")} kVA`],
      reference: o.id === "sec-drift"
        ? `Best-performing stable months: ${analysis.baselineSec.toFixed(3)} kWh/${factory.productUnit}`
        : "Factory contract, entered bills and deterministic GridMind rule set",
      context: `${factory.sector}; monthly resolution; ${n}-month analysis window`,
      uncertainty: equipmentBased
        ? "Screening estimate only. Actual load, duty cycle and operating state are not measured."
        : o.confidence === "high"
          ? "Input coverage is strong, but tariff interpretation and operating context still require review."
          : "Monthly data cannot isolate a physical cause or individual machine contribution.",
      missingEvidence: equipmentBased
        ? ["Sub-metered load profile", "Loaded/unloaded or running/idle state", "Site inspection or operator confirmation"]
        : o.id === "sec-drift"
          ? ["Shift-level production and energy", "Operating-condition and product-mix context", "System-level sub-metering"]
          : ["Utility bill demand calculation", "15-minute demand profile", "Operating schedule and simultaneous-load record"],
      possibleExplanations: equipmentBased
        ? ["Idle or part-load operation", "Nameplate assumptions differ from actual duty", "Unrecorded production or operating context"]
        : o.id === "sec-drift"
          ? ["Idle running", "Product mix or rework", "Seasonal auxiliaries", "Process deterioration"]
          : ["Contract mismatch", "Coincident starts", "Tariff structure", "Production schedule"],
      financialState: state === "implemented" ? "potential" : "estimated",
      verificationState: state === "implemented" ? "ready for review" : state === "in_progress" ? "in progress" : "not started",
      evidenceState: equipmentBased ? "hypothesis" : o.confidence === "low" ? "hypothesis" : "estimated",
    };
  });

  const hasIdle = mapped.some((o) => o.opportunityClass === "Idle / off-hours consumption");
  if (!hasIdle) {
    mapped.push({
      id: "evidence-idle-load",
      title: "Off-hours energy cannot yet be quantified",
      category: "process",
      opportunityClass: "Idle / off-hours consumption",
      system: "Whole factory",
      problem: "Monthly bills do not separate productive consumption from nights, breaks or shutdown periods.",
      cause: "Insufficient time-resolution to distinguish idle load from production load.",
      action: "Collect a 15-minute main-incomer profile for four representative weeks and annotate shifts and shutdowns.",
      impactAnnual: 0,
      savingAnnual: 0,
      investment: 0,
      paybackMonths: null,
      confidence: "low",
      calc: ["No financial value calculated: interval energy and shift schedule are missing."],
      evidence: ["Monthly electricity totals", "Monthly operating hours"],
      reference: "No valid off-hours reference available",
      context: `${factory.sector}; monthly resolution only`,
      uncertainty: "Unknown. Missing interval data prevents a defensible loss or saving estimate.",
      missingEvidence: ["15-minute main meter data", "Shift calendar", "Planned shutdown periods"],
      possibleExplanations: ["Base utility load", "Idle production equipment", "Essential continuous services"],
      financialState: "potential",
      verificationState: "not started",
      evidenceState: "unknown",
    });
  }
  return mapped.sort((a, b) => b.savingAnnual - a.savingAnnual);
}

export const moneyAtRisk = (items: IntelligenceOpportunity[]) =>
  items.reduce((sum, item) => sum + (item.evidenceState === "unknown" ? 0 : item.impactAnnual), 0);