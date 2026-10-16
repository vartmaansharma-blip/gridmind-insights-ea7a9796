import { describe, expect, it } from "vitest";
import { addReview, caseEconomics, evaluateCase, outcomeIssues, technicalSnapshot } from "./engine";
import { initialWorkspace, syntheticCase } from "./fixtures";
import {
  addCase,
  loadWorkspace,
  MAX_BACKUP_BYTES,
  parseWorkspace,
  reviseCase,
  saveWorkspace,
  serializeWorkspace,
  STORAGE_KEY,
} from "./workspace";
import { decisionBrief, internalEconomics, statementOfWork } from "./brief";
import { caseSchema } from "./schema";
import { buildSyntheticC4Brief } from "../gridmind/synthetic-c4-brief";

const review = (decision: "accept" | "reject" | "revise" = "accept") => ({
  id: "R01",
  reviewer: "Fictional domain expert",
  competence: "Synthetic electrical/tariff expertise",
  scope: "E01–E03 and all calculations; methodology only",
  decision,
  rationale: "Arithmetic checked in fictional exercise; cause and savings not established.",
  dissent: "",
  at: "2026-10-16T00:00:00Z",
});

describe("bounded investigation method", () => {
  it("reproduces C4 known-answer arithmetic without financial or causal claims", () => {
    const e = evaluateCase(syntheticCase("C4"));
    expect(e.issues).toEqual([]);
    expect(e.calculations.at(-1)?.result).toBe(33.33);
    expect(e.calculations[2].result).toBeCloseTo(13.333333);
    expect(e.status).toBe("awaiting_review");
    expect(e.approvedForCustomerDelivery).toBe(false);
  });
  it.each([
    "owner",
    "boundary",
    "acceptance",
    "exclusions",
    "stopRules",
    "alternative",
    "residualGap",
  ] as const)("blocks missing scope %s", (key) => {
    const c = syntheticCase("C4");
    c.scope[key] = "";
    expect(evaluateCase(c).status).toBe("blocked");
    expect(evaluateCase(c).calculations).toEqual([]);
  });
  it("rejects invalid calendar dates and reversed scope", () => {
    const c = syntheticCase("C4");
    expect(() => caseSchema.parse({ ...c, scope: { ...c.scope, from: "2026-02-30" } })).toThrow();
    c.scope.to = "2025-01-01";
    expect(evaluateCase(c).issues.join(" ")).toMatch(/reversed/);
  });
  it.each(["permitted", "checked"] as const)("blocks sources missing %s", (key) => {
    const c = syntheticCase("C4");
    c.evidence[0][key] = false;
    expect(evaluateCase(c).calculations).toEqual([]);
  });
  it("does not expose a lower-level comparison around a scope/permission blocker", () => {
    const c = syntheticCase("C4");
    c.evidence[0].permitted = false;
    expect(evaluateCase(c).c4).toBeNull();
    expect(evaluateCase(c).calculations).toEqual([]);
  });
  it("retains conflicting evidence while withholding calculations", () => {
    const c = syntheticCase("C4");
    c.evidence[0].conflict = "Bill vs ledger quantity disagree";
    expect(evaluateCase(c).issues.join(" ")).toMatch(/unresolved conflict/);
    expect(evaluateCase(c).observations).toEqual([]);
    expect(c.evidence[0].conflict).toMatch(/disagree/);
  });
  it("blocks duplicate source references, IDs and invoices", () => {
    const c = syntheticCase("C4");
    c.evidence[1].reference = c.evidence[0].reference;
    c.periods[1].invoiceId = c.periods[0].invoiceId;
    c.periods[1].id = c.periods[0].id;
    expect(evaluateCase(c).issues.join(" ")).toMatch(/Duplicate source reference/);
    expect(evaluateCase(c).issues.join(" ")).toMatch(/IDs must be unique/);
    expect(evaluateCase(c).calculations).toEqual([]);
  });
  it("blocks a missing/nonconsecutive period, wrong production unit and missing source", () => {
    const c = syntheticCase("C4");
    c.periods[1].month = "2026-04";
    c.periods[1].unit = "kg";
    c.periods[1].evidenceId = "missing";
    expect(evaluateCase(c).issues.join(" ")).toMatch(/production basis/);
    expect(evaluateCase(c).issues.join(" ")).toMatch(/does not resolve/);
    expect(evaluateCase(c).calculations).toEqual([]);
  });
  it("never imputes zero or nonfinite production", () => {
    const c = syntheticCase("C4");
    c.periods[0].production = 0;
    expect(evaluateCase(c).calculations).toEqual([]);
    c.periods[0].production = NaN;
    expect(() => evaluateCase(c)).toThrow();
  });
  it("rejects derived numeric overflow in the reused C4 evaluator", () => {
    const c = syntheticCase("C4");
    const result = buildSyntheticC4Brief({
      caseId: c.id,
      origin: "synthetic",
      decisionQuestion: "test",
      decisionOwnerRole: "test",
      records: c.periods.map((p) => ({
        evidenceId: p.id,
        invoiceId: p.id,
        month: p.month,
        kwh: Number.MAX_VALUE,
        productionUnits: Number.MIN_VALUE,
        billedInr: 1,
        sourceReference: p.id,
        checkedAgainstSource: true,
      })),
    });
    expect(result.comparison).toBeNull();
    expect(result.evidenceIssues.join(" ")).toMatch(/not finite/);
  });
  it("blocks C1 duration while clocks are unreconciled", () => {
    const e = evaluateCase(syntheticCase("C1"));
    expect(e.calculations).toEqual([]);
    expect(e.issues.join(" ")).toMatch(/reconcile the clock/);
  });
  it("computes 62 minutes only after explicit clock reconciliation", () => {
    const c = syntheticCase("C1");
    c.events.forEach((e) => {
      e.reconciledTime = e.rawTime;
      e.clockVerified = true;
    });
    expect(evaluateCase(c).calculations[0].result).toBe(62);
    expect(evaluateCase(c).observations.join(" ")).toMatch(/does not establish/);
  });
  it("rejects impossible C1 dates and wrong timezone-free timestamps", () => {
    const c = syntheticCase("C1");
    c.events.forEach((e) => {
      e.reconciledTime = e.rawTime;
      e.clockVerified = true;
    });
    c.events[0].rawTime = "2026-09-31T08:14:00Z";
    c.events[1].reconciledTime = "2026-09-17T08:42:00";
    expect(evaluateCase(c).calculations).toEqual([]);
  });
  it("does not sum overlapping or duplicate stops", () => {
    const c = syntheticCase("C1");
    c.events.forEach((e) => {
      e.reconciledTime = e.rawTime;
      e.clockVerified = true;
    });
    c.events.push({ ...c.events[0], id: "T04" });
    expect(evaluateCase(c).issues.join(" ")).toMatch(/allocation/);
    expect(evaluateCase(c).calculations).toEqual([]);
  });
  it("blocks unsupported root-cause or verified-savings observation wording", () => {
    const c = syntheticCase("C4");
    c.findings[0].type = "observation";
    c.findings[0].statement = "The root cause produced verified savings.";
    expect(evaluateCase(c).issues.join(" ")).toMatch(/not supported/);
  });
  it("requires counter-evidence and a discriminating check for hypotheses", () => {
    const c = syntheticCase("C4");
    c.findings[0].counterEvidence = "";
    expect(evaluateCase(c).issues.join(" ")).toMatch(/hypotheses require/);
  });
  it("retains rejected findings, but excludes them from executive claims", () => {
    const c = syntheticCase("C4");
    c.findings[0].disposition = "rejected";
    c.findings[0].statement = "REJECTED-STATEMENT";
    expect(evaluateCase(c).issues).toEqual([]);
    expect(c.findings).toHaveLength(1);
    expect(decisionBrief(c)).not.toContain("REJECTED-STATEMENT");
  });
  it("stops all analysis explicitly", () => {
    const c = syntheticCase("C4");
    c.stopped = true;
    c.stopReason = "Reviewer unavailable";
    expect(evaluateCase(c).status).toBe("stopped");
    expect(evaluateCase(c).calculations).toEqual([]);
  });
});

describe("review and release controls", () => {
  it("never permits real customer release, including simulated acceptance", () => {
    const c = addReview(syntheticCase("C4"), review());
    expect(evaluateCase(c).status).toBe("synthetic_review_complete");
    expect(evaluateCase(c).approvedForCustomerDelivery).toBe(false);
    expect(decisionBrief(c)).toContain("Customer release:** BLOCKED");
    expect(decisionBrief(c)).toContain("NOT A CUSTOMER RESULT OR TECHNICAL APPROVAL");
  });
  it("retains rejection and revision decisions", () => {
    const c = addReview(addReview(syntheticCase("C4"), review("reject")), {
      ...review("revise"),
      id: "R02",
    });
    expect(evaluateCase(c).status).toBe("revise");
    expect(c.reviews).toHaveLength(2);
  });
  it("requires substantive review and forbids acceptance over unresolved dissent", () => {
    expect(() => addReview(syntheticCase("C4"), { ...review(), competence: "" })).toThrow(
      /required/,
    );
    expect(() =>
      addReview(syntheticCase("C4"), { ...review(), dissent: "Unresolved material disagreement" }),
    ).toThrow(/dissent/);
  });
  it("blocks acceptance while evidence or challenge is unresolved", () => {
    const c = syntheticCase("C4");
    c.findings[0].disposition = "open";
    expect(() => addReview(c, review())).toThrow(/blockers/);
    expect(addReview(c, review("reject")).reviews).toHaveLength(1);
  });
  it("invalidates review on a technical edit and preserves the approved version", () => {
    const w = initialWorkspace();
    w.cases[0] = addReview(w.cases[0], review());
    const changed = structuredClone(w.cases[0]);
    changed.evidence[0].limitation = "Corrected limitation";
    const next = reviseCase(w, changed, "Source correction");
    expect(evaluateCase(next.cases[0]).reviewCurrent).toBe(false);
    expect(evaluateCase(next.history[0].before).reviewCurrent).toBe(true);
    expect(next.history[0].before.evidence[0].limitation).not.toBe(changed.evidence[0].limitation);
  });
  it("does not invalidate technical review for a separate decision/economics record", () => {
    const c = addReview(syntheticCase("C4"), review());
    const snapshot = technicalSnapshot(c);
    c.decision.status = "declined";
    c.labor.push({ id: "L", role: "founder", task: "exercise", hours: 1, shadowRate: 100 });
    expect(technicalSnapshot(c)).toBe(snapshot);
    expect(evaluateCase(c).reviewCurrent).toBe(true);
  });
});

describe("method revision binding", () => {
  it("invalidates a saved review when its method version no longer matches", () => {
    const c = addReview(syntheticCase("C4"), review());
    c.reviews[0].snapshot = c.reviews[0].snapshot.replace(
      "investigation-method-v1",
      "legacy-method",
    );
    expect(evaluateCase(c).reviewCurrent).toBe(false);
    expect(evaluateCase(c).status).toBe("awaiting_review");
  });
});

describe("synthetic persistence and recovery", () => {
  it("round-trips corrections, review, outcomes and history", () => {
    const w = initialWorkspace();
    const c = structuredClone(w.cases[0]);
    c.title = "Correction";
    const next = reviseCase(w, c, "Correct title");
    const storage = new Map<string, string>();
    const adapter = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
    };
    saveWorkspace(adapter, next);
    expect(loadWorkspace(adapter)).toEqual(next);
    expect(storage.has(STORAGE_KEY)).toBe(true);
    expect(w.cases[0].title).not.toBe("Correction");
  });
  it("fails closed for customer origin, extra fields, malformed and oversized backups", () => {
    const w = initialWorkspace();
    expect(() => parseWorkspace(JSON.stringify({ ...w, origin: "customer" }))).toThrow();
    expect(() => parseWorkspace(JSON.stringify({ ...w, tenantId: "not-supported" }))).toThrow();
    expect(() => parseWorkspace("broken")).toThrow();
    expect(() => parseWorkspace(" ".repeat(MAX_BACKUP_BYTES + 1))).toThrow(/limit/);
    w.cases[0].origin = "customer" as "synthetic";
    expect(() => serializeWorkspace(w)).toThrow();
  });
  it("prevents stale saves, missing reasons, duplicate cases and history truncation", () => {
    const w = initialWorkspace();
    const next = reviseCase(w, w.cases[0], "Exercise");
    expect(() => reviseCase(next, w.cases[0], "stale")).toThrow(/Stale/);
    expect(() => reviseCase(w, w.cases[0], "")).toThrow(/reason/);
    expect(() => addCase(w, w.cases[0])).toThrow(/Duplicate/);
    w.history = Array.from({ length: 100 }, () => next.history[0]);
    expect(() => reviseCase(w, w.cases[0], "full")).toThrow(/full/);
  });
  it("propagates storage quota failures rather than claiming a save", () => {
    expect(() =>
      saveWorkspace(
        {
          getItem: () => null,
          setItem: () => {
            throw new Error("Quota exceeded");
          },
        },
        initialWorkspace(),
      ),
    ).toThrow(/Quota/);
  });
});

describe("decision, follow-up and cash versus labor economics", () => {
  it("keeps quote, invoice and collection distinct; uncollected contribution stays unknown", () => {
    const c = syntheticCase("C4");
    c.payments.push({
      id: "Q",
      stage: "quoted",
      amount: 15000,
      at: "2026-10-16",
      reference: "Hypothetical quote",
    });
    expect(caseEconomics(c).sums.collected).toBe(0);
    expect(caseEconomics(c).cashContribution).toBeNull();
    expect(statementOfWork(c)).toContain("TO BE QUOTED");
  });
  it("computes cash and adjusted contribution without duplicating reviewer labor", () => {
    const c = syntheticCase("C4");
    c.labor = [
      { id: "L1", role: "founder", task: "analysis", hours: 3, shadowRate: 500 },
      { id: "L2", role: "reviewer", task: "review", hours: 2, shadowRate: 1000 },
    ];
    c.expenses = [
      { id: "X1", category: "reviewer", amount: 2000, reference: "Review invoice" },
      { id: "X2", category: "travel", amount: 500, reference: "Travel receipt" },
    ];
    c.payments = (["quoted", "contracted", "invoiced", "collected"] as const).map((stage) => ({
      id: stage,
      stage,
      amount: 10000,
      at: "2026-10-16",
      reference: stage,
    }));
    const e = caseEconomics(c);
    expect(e.issues).toEqual([]);
    expect(e.cashContribution).toBe(7500);
    expect(e.adjustedContribution).toBe(6000);
    expect(e.shadowLabor).toBe(1500);
    expect(internalEconomics(c)).toContain("INTERNAL SYNTHETIC");
    expect(decisionBrief(c)).not.toContain("cashContribution");
  });
  it("blocks contributions for duplicate costs, missing stages or invalid payment sequence", () => {
    const c = syntheticCase("C4");
    c.expenses = [
      { id: "1", category: "other", amount: 10, reference: "same" },
      { id: "2", category: "other", amount: 10, reference: "same" },
    ];
    c.payments = [
      { id: "1", stage: "collected", amount: 100, at: "2026-10-16", reference: "receipt" },
    ];
    expect(caseEconomics(c).issues.join(" ")).toMatch(/unique/);
    expect(caseEconomics(c).issues.join(" ")).toMatch(/preceding/);
    expect(caseEconomics(c).cashContribution).toBeNull();
  });
  it("rejects negative cash and distinguishes unknown follow-up from measured zero", () => {
    const c = syntheticCase("C4");
    c.expenses.push({ id: "1", category: "other", amount: -1, reference: "bad" });
    expect(() => caseSchema.parse(c)).toThrow();
    const valid = syntheticCase("C4");
    valid.decision.status = "declined";
    expect(valid.outcome.status).toBe("not_measured");
    valid.outcome = {
      status: "observed",
      baseline: 0,
      observed: 0,
      metric: "Events",
      unit: "count",
      from: "2026-01-01",
      to: "2026-03-31",
      evidenceIds: ["E01"],
      confounders: "Operating mix changed",
    };
    expect(outcomeIssues(valid)).toEqual([]);
    expect(decisionBrief(valid)).toContain("Attributable verified savings: NOT ESTABLISHED");
  });
  it("blocks unsupported observed outcomes and preserves attribution caveats", () => {
    const c = syntheticCase("C4");
    c.outcome.status = "observed";
    expect(outcomeIssues(c).length).toBeGreaterThan(0);
    expect(decisionBrief(c)).toContain("Outcome: observed. BLOCKED");
  });
});
