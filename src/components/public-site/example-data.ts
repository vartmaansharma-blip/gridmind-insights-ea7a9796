/**
 * Fictional example investigation used on the public site.
 * Every value is invented for demonstration. No customer, tariff order or
 * real bill is represented. No charge, saving or error is asserted.
 */
export type FieldStatus = "Needs review" | "Missing context" | "Source noted";

export interface ExampleField {
  id: string;
  label: string;
  value: string;
  question: string;
  evidence: string;
  observation: string;
  missing: string[];
  nextCheck: string;
  status: FieldStatus;
}

export const EXAMPLE_FACTORY = "Example Forge Works (fictional), Adityapur";
export const EXAMPLE_PERIOD = "August 2026 (fictional bill)";

export const EXAMPLE_FIELDS: ExampleField[] = [
  {
    id: "max-demand",
    label: "Recorded maximum demand",
    value: "1,912 kVA",
    question: "What explains this demand-related charge?",
    evidence: "Bill line \"Recorded MD\" shows 1,912 kVA. Bill line \"Contract demand\" shows 1,750 kVA.",
    observation: "The recorded maximum demand printed on this bill is higher than the contract demand printed on the same bill.",
    missing: ["The tariff schedule that applies to this connection", "Maximum demand for the previous 11 months", "When in the month the peak was recorded"],
    nextCheck: "Obtain the applicable tariff order and 12 months of bills so a qualified reviewer can read how demand is billed.",
    status: "Needs review",
  },
  {
    id: "contract-demand",
    label: "Contract demand",
    value: "1,750 kVA",
    question: "Is the contract demand still matched to how the plant runs?",
    evidence: "Bill line \"Contract demand\" shows 1,750 kVA.",
    observation: "One bill shows the contract figure but not how it was chosen or when it last changed.",
    missing: ["Connection agreement or last revision letter", "Planned load changes (new lines, shifts)"],
    nextCheck: "Ask the plant for the connection agreement and any planned load changes before discussing the contract figure.",
    status: "Missing context",
  },
  {
    id: "power-factor",
    label: "Average power factor",
    value: "0.89",
    question: "Does power factor affect anything on this bill?",
    evidence: "Bill line \"Avg PF\" shows 0.89. No separate power-factor line item is printed.",
    observation: "A power factor is printed. Whether any condition applies to it depends on the tariff, which is not on the bill.",
    missing: ["Tariff provisions on power factor", "Capacitor bank details and maintenance records"],
    nextCheck: "Check the tariff provisions with a qualified electrical reviewer; record capacitor bank status from the plant.",
    status: "Needs review",
  },
  {
    id: "tariff-category",
    label: "Tariff category",
    value: "HT industrial (as printed)",
    question: "Is the connection billed under the category the plant expects?",
    evidence: "Bill header shows \"HT industrial\". No sub-category code is printed.",
    observation: "The category is printed in short form only.",
    missing: ["Full category code from the utility", "The plant's understanding of its category"],
    nextCheck: "Request the full category code from the utility account and compare it with the plant's records.",
    status: "Missing context",
  },
  {
    id: "energy",
    label: "Energy consumed",
    value: "2,41,800 kWh",
    question: "How does this month's consumption relate to production?",
    evidence: "Bill line \"Units consumed\" shows 2,41,800 kWh.",
    observation: "Consumption is recorded. Production for the same month is not on the bill, so energy per unit cannot be read from it.",
    missing: ["Monthly production for the same period", "Operating days and shifts"],
    nextCheck: "Collect monthly production and operating days so consumption can be compared like for like.",
    status: "Source noted",
  },
];

export function buildExampleBrief(selectedIds: string[]): string {
  const fields = selectedIds.length ? EXAMPLE_FIELDS.filter((f) => selectedIds.includes(f.id)) : EXAMPLE_FIELDS;
  const lines = [
    "ILLUSTRATIVE EXAMPLE — FICTIONAL DATA",
    "This is not a real investigation, bill, factory or finding.",
    "",
    "GridMind — example evidence brief",
    `Factory: ${EXAMPLE_FACTORY}`,
    `Source: ${EXAMPLE_PERIOD}`,
    "",
  ];
  fields.forEach((f, i) => {
    lines.push(
      `${i + 1}. ${f.label}: ${f.value}  [${f.status}]`,
      `   Question: ${f.question}`,
      `   Evidence: ${f.evidence}`,
      `   Observation: ${f.observation}`,
      `   Not yet known: ${f.missing.join("; ")}`,
      `   Next check: ${f.nextCheck}`,
      "",
    );
  });
  lines.push(
    "Limits",
    "- No saving, error or overcharge is claimed.",
    "- Observations are preliminary and need qualified review.",
    "- Any change to the connection must be decided by qualified plant personnel.",
  );
  return lines.join("\n");
}
