import { evaluateCase } from "./engine";
import type { Investigation } from "./schema";

export function customerBrief(c: Investigation): string {
  const e = evaluateCase(c);
  return `# ${c.title}\n\nSYNTHETIC SAMPLE — not professional approval or a customer result.\n\nVersion ${c.revision} · ${c.scope.site} · ${c.scope.from} to ${c.scope.to}\n\n## Your decision\n${c.scope.question}\n\n## Scope\n${c.scope.boundary}\n\n## Established within the sample method\n${e.observations.map((v) => `- ${v}`).join("\n")}\n\n## Reproducible calculations\n${e.calculations.map((v) => `- ${v.label}: ${v.result} ${v.unit}. Sources: ${v.evidenceIds.join(", ")}. Formula: ${v.formula}`).join("\n")}\n\n## Limits and next steps\nPhysical cause, recoverable value and verified savings are not established.\n${c.scope.exclusions}\n\n${c.findings
    .filter((f) => f.disposition === "included")
    .map(
      (f) =>
        `- ${f.statement} Sources: ${f.evidenceIds.join(", ")}. Uncertainty: ${f.uncertainty}. Next check: ${f.nextCheck}`,
    )
    .join(
      "\n",
    )}\n\nCustomer release: BLOCKED for real-world use. All records and review actions in this environment are synthetic.`;
}
