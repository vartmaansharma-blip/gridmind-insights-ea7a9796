import { METHOD_VERSION, evaluateCase, caseEconomics, outcomeIssues } from "./engine";
import type { Investigation } from "./schema";

const line = (v: string) => v.replace(/[\r\n]+/g, " ").replace(/[<>]/g, "");
const list = (items: string[]) =>
  items.length ? items.map((v) => `- ${line(v)}`).join("\n") : "- Not established.";

export function decisionBrief(c: Investigation): string {
  const e = evaluateCase(c);
  const ready = e.status === "synthetic_review_complete";
  return `# Industrial Decision Brief — ${line(c.id)}\n
**SYNTHETIC EXAMPLE — NOT A CUSTOMER RESULT OR TECHNICAL APPROVAL**
**Version:** ${c.revision} · **Method:** ${METHOD_VERSION} · **Workflow:** ${e.status}
**Customer release:** BLOCKED. All sources are invented; review actions are simulated.

## Executive decision page
**Decision:** ${line(c.scope.question)}
**Owner:** ${line(c.scope.owner)} · **Site/boundary:** ${line(c.scope.site)} / ${line(c.scope.boundary)}
**Window:** ${c.scope.from} → ${c.scope.to}

### Established observations within the synthetic method
${list(e.observations)}

### Unknowns and release blockers
${list([...e.issues, "Physical cause, recoverable amount and realized savings have not been established.", "No real qualified reviewer has approved this synthetic case.", ...c.evidence.map((s) => `${s.id}: ${s.limitation || "Limitations require review."}`)])}

### Competing explanations and next verification decisions
${list(c.findings.filter((f) => f.disposition !== "rejected").map((f) => `${f.id} [${f.type}; ${f.disposition}]: ${f.statement} Sources: ${f.evidenceIds.join(", ")}. Counter-evidence: ${f.counterEvidence || "Not stated"}. Uncertainty: ${f.uncertainty}. Next check: ${f.nextCheck || "Not stated"}.`))}

### Review and responsibility
${e.review ? `Latest SIMULATED reviewer: ${line(e.review.reviewer)}. Competence: ${line(e.review.competence)}. Scope: ${line(e.review.scope)}. Decision: ${e.review.decision}. Review of revision ${e.review.revision} at ${e.review.at}. Current content matches review: ${e.reviewCurrent ? "yes" : "NO — stale/incomplete"}. Rationale: ${line(e.review.rationale)}. Dissent: ${line(e.review.dissent) || "None recorded"}.` : "Review not performed."}
${ready ? "Synthetic review workflow completed; this remains an invented demonstration." : "Draft/inconclusive output; resolve blockers and review before completing the simulated workflow."}
Physical decisions remain with qualified customer personnel under site procedures.

### Customer decision and follow-up
Status: ${c.decision.status}. Owner: ${line(c.decision.owner) || "Not assigned"}. Date: ${c.decision.at || "Not recorded"}. Rationale: ${line(c.decision.rationale) || "Not recorded"}.
Outcome: ${c.outcome.status}. ${outcomeIssues(c).length ? `BLOCKED: ${outcomeIssues(c).join(" ")}` : `Metric: ${line(c.outcome.metric) || "Not defined"}. Baseline: ${c.outcome.baseline ?? "unknown"}; observed: ${c.outcome.observed ?? "unknown"} ${line(c.outcome.unit)}. Window: ${c.outcome.from || "unknown"} → ${c.outcome.to || "unknown"}. Sources: ${c.outcome.evidenceIds.join(", ") || "none"}. Confounders: ${line(c.outcome.confounders) || "not assessed"}.`}
Attributable verified savings: NOT ESTABLISHED.

## Technical appendix
### Reproducible calculations
${list(e.calculations.map((v) => `${v.label}: ${v.formula} = ${v.result} ${v.unit}. Sources: ${v.evidenceIds.join(", ")}.`))}
No tariff validity, recoverable value or root cause follows from this arithmetic.

### Source register
${list(c.evidence.map((s) => `${s.id} — ${s.reference}; owner: ${s.owner}; received: ${s.receivedAt}; source checked: ${s.checked}; permitted: ${s.permitted}; conflict: ${s.conflict || "none recorded"}; retention: ${s.retention}; limitation: ${s.limitation || "not stated"}.`))}

### Raw period records
${list(c.periods.map((p) => `${p.id}/${p.evidenceId}: invoice ${p.invoiceId}, ${p.month}, ${p.kwh} kWh, INR ${p.billedInr} billed, ${p.production} ${p.unit}.`))}

### Raw and reconciled chronology
${list(c.events.map((t) => `${t.id}/${t.evidenceId}: ${t.description} Raw: ${t.rawTime} (${t.clock}); reconciled: ${t.reconciledTime || "NOT RECONCILED"}; clock verified: ${t.clockVerified}.`))}

### Scope, exclusions and acceptance
Exclusions: ${line(c.scope.exclusions)}
Acceptance: ${line(c.scope.acceptance)}
Stop rules: ${line(c.scope.stopRules)}
Current alternative: ${line(c.scope.alternative)}
Residual gap: ${line(c.scope.residualGap)}

### Review history and retained dissent
${list(c.reviews.map((r) => `${r.id}: SIMULATED ${r.decision} by ${r.reviewer} at ${r.at}, revision ${r.revision}; scope: ${r.scope}; rationale: ${r.rationale}; dissent: ${r.dissent || "none recorded"}.`))}
`;
}

export function statementOfWork(c: Investigation): string {
  return `# Bounded investigation SOW — ${line(c.id)}
**DRAFT SYNTHETIC TEMPLATE — commercial terms unvalidated; not an offer or contract.**

- Decision: ${line(c.scope.question)}
- Buyer / decision owner: ${line(c.scope.owner)}
- Site / boundary / window: ${line(c.scope.site)} / ${line(c.scope.boundary)} / ${c.scope.from} → ${c.scope.to}
- Inputs: source register references; permitted source records only after Tier 2.
- Method: ${c.candidate === "C4" ? "Verified period comparison with explicit units and assumptions" : "Source-linked chronology with raw/reconciled clocks and competing hypotheses"}.
- Reviewer: NOT ENGAGED. Qualification, scope, fee, availability, independence, rework and liability terms must be agreed.
- Deliverable: executive Decision Brief plus evidence/calculation appendix, version and dated review.
- Acceptance: ${line(c.scope.acceptance)}
- Exclusions: ${line(c.scope.exclusions)}
- Stop / inconclusive rule: ${line(c.scope.stopRules)}; notify buyer and agree pause/re-scope/remedy before further work.
- Customer responsibilities: authorized records, named decision/data owner, clarification and operational decisions.
- Rights / secure custody / recipients / retention / deletion: TO BE AGREED before intake. Local synthetic browser storage is not approved custody.
- Fee / tax / quote validity / payment timing: TO BE QUOTED after actual effort and reviewer costs; no published price.
- Delivery timing / clarification limit: TO BE AGREED; specify one clarification cycle and limits before contract.
- Follow-up metric / baseline / window / owner: TO BE AGREED; no root-cause, positive-conclusion or savings guarantee.
- Signatures and engagement approval: NOT EXECUTED.
`;
}
export function internalEconomics(c: Investigation): string {
  const e = caseEconomics(c);
  return `# INTERNAL SYNTHETIC economics — ${line(c.id)}\nNot customer results, revenue or profit.\n\n${JSON.stringify(e, null, 2)}\n\nFounder/analyst shadow labor is separate from cash expenses; reviewer invoices belong in expenses. Acquisition, shared overhead, contingency, rework allowance and payment risk must be considered before quoting. No fee collection is inferred from a quote or invoice.\n`;
}
