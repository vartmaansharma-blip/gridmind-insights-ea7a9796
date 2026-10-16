import { caseSchema, type Investigation, type Workspace } from "./schema";

export function syntheticCase(candidate: "C1" | "C4", id = `SYN-${candidate}-01`): Investigation {
  const isC4 = candidate === "C4";
  const c: Investigation = {
    id,
    origin: "synthetic",
    candidate,
    revision: 1,
    title: isC4 ? "Monthly energy intensity decision" : "Recurring line interruption",
    scope: {
      question: isC4
        ? "Should the plant commission further checks on the recorded change in energy intensity?"
        : "What does the event history establish about the interruption, and which evidence should be checked next?",
      owner: "Synthetic plant manager",
      site: isC4 ? "SYNTHETIC-PLANT-01" : "SYNTHETIC-PLANT-02",
      boundary: isC4
        ? "Whole-site billing and conforming output; same fictional meter"
        : "Packaging line P-2; one bounded interruption",
      from: isC4 ? "2026-01-01" : "2026-09-17",
      to: isC4 ? "2026-03-31" : "2026-09-17",
      exclusions:
        "No equipment instructions, tariff validity, causal diagnosis or savings verification.",
      acceptance:
        "Trace every observation to invented sources, reproduce arithmetic, expose limitations and reviewer state.",
      stopRules:
        "Stop if permission, source verification or qualified review cannot be established. Synthetic demonstration only.",
      alternative:
        "Fictional plant team manually compares records; actual buyer alternative not yet interviewed.",
      residualGap:
        "Hypothesis only: source reconciliation may clarify the next investigation decision. Buyer validation pending.",
    },
    stopped: false,
    stopReason: "",
    evidence: (isC4
      ? [
          "Invented January bill + production record",
          "Invented February bill + production record",
          "Invented March bill + production record",
        ]
      : ["Invented PLC export", "Invented downtime record", "Invented maintenance work order"]
    ).map((reference, i) => ({
      id: `E0${i + 1}`,
      reference,
      owner: "Fictional records custodian",
      origin: "synthetic",
      permitted: true,
      checked: true,
      conflict: "",
      receivedAt: "2026-10-16T00:00:00Z",
      retention: "Synthetic local exercise; delete using workspace reset",
      limitation: isC4
        ? "Operating mix and comparability are not established."
        : "Source clocks are unverified; alarm is not root cause.",
    })),
    periods: isC4
      ? [
          {
            id: "P01",
            evidenceId: "E01",
            invoiceId: "SYN-001",
            month: "2026-01",
            kwh: 100000,
            billedInr: 900000,
            production: 10000,
            unit: "conforming units",
          },
          {
            id: "P02",
            evidenceId: "E02",
            invoiceId: "SYN-002",
            month: "2026-02",
            kwh: 110000,
            billedInr: 990000,
            production: 10000,
            unit: "conforming units",
          },
          {
            id: "P03",
            evidenceId: "E03",
            invoiceId: "SYN-003",
            month: "2026-03",
            kwh: 120000,
            billedInr: 1080000,
            production: 9000,
            unit: "conforming units",
          },
        ]
      : [],
    events: isC4
      ? []
      : [
          {
            id: "T01",
            evidenceId: "E01",
            rawTime: "2026-09-17T08:14:00+05:30",
            reconciledTime: "",
            clock: "PLC clock",
            clockVerified: false,
            kind: "stop",
            description: "Line stop and drive-overload alarm A17 recorded.",
          },
          {
            id: "T02",
            evidenceId: "E03",
            rawTime: "2026-09-17T08:42:00+05:30",
            reconciledTime: "",
            clock: "Maintenance clock",
            clockVerified: false,
            kind: "observation",
            description:
              "Alarm A17 recorded again after accumulation was cleared; action sequence incomplete.",
          },
          {
            id: "T03",
            evidenceId: "E02",
            rawTime: "2026-09-17T09:16:00+05:30",
            reconciledTime: "",
            clock: "Production clock",
            clockVerified: false,
            kind: "restart",
            description:
              "Running recorded after maintenance action; exact action and causal effect unknown.",
          },
        ],
    findings: [
      {
        id: "H01",
        type: "hypothesis",
        statement: isC4
          ? "A changed operating mix could contribute to the intensity difference."
          : "Material accumulation may have contributed to the interruption.",
        evidenceIds: isC4 ? ["E01", "E03"] : ["E01", "E03"],
        counterEvidence: isC4
          ? "The fixture does not describe the product mix, operating hours or meter boundary validation."
          : "A17 recurred after clearing; no qualified causal interpretation exists.",
        uncertainty: "Plausible only; no cause established.",
        nextCheck:
          "Ask the qualified customer reviewer which additional records can distinguish competing explanations.",
        disposition: "included",
      },
    ],
    reviews: [],
    decision: { status: "pending", owner: "", rationale: "", at: "" },
    outcome: {
      status: "not_measured",
      metric: "",
      baseline: null,
      observed: null,
      unit: "",
      from: "",
      to: "",
      evidenceIds: [],
      confounders: "",
    },
    labor: [],
    expenses: [],
    payments: [],
  };
  return caseSchema.parse(c);
}
export function initialWorkspace(): Workspace {
  return {
    version: 1,
    origin: "synthetic",
    cases: [syntheticCase("C4"), syntheticCase("C1")],
    history: [],
  };
}
