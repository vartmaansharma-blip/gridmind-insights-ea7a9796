import type { Field } from "./record-form";

export const textField = (key: string, label: string, kind?: Field["kind"]): Field => ({
  key,
  label,
  kind,
});
export const recordFields: Field[] = [
  textField("reference", "Original source reference"),
  textField("owner", "Source owner"),
  textField("permitted", "Permitted for this synthetic exercise", "checkbox"),
  textField("checked", "Checked against the invented source", "checkbox"),
  textField("conflict", "Unresolved contradictions (blank only when resolved)", "multiline"),
  textField("limitation", "Source limitations", "multiline"),
  textField("retention", "Custody / retention / deletion rule"),
];
export const periodFields: Field[] = [
  textField("evidenceId", "Source ID"),
  textField("invoiceId", "Invoice reference"),
  textField("month", "Period YYYY-MM"),
  textField("kwh", "Consumption (kWh)", "number"),
  textField("billedInr", "Documented bill amount (INR)", "number"),
  textField("production", "Conforming output", "number"),
  textField("unit", "Production basis (conforming units)"),
];
export const eventFields: Field[] = [
  textField("evidenceId", "Source ID"),
  textField("rawTime", "Raw timestamp with timezone"),
  textField("clock", "Source clock"),
  textField("reconciledTime", "Reconciled timestamp with timezone"),
  textField("clockVerified", "Clock reconciliation verified in this exercise", "checkbox"),
  { key: "kind", label: "Boundary classification", options: ["observation", "stop", "restart"] },
  textField("description", "Observed event", "multiline"),
];
export const findingFields: Field[] = [
  { key: "type", label: "Evidence class", options: ["observation", "hypothesis", "next_check"] },
  textField("statement", "Statement", "multiline"),
  textField("evidenceIds", "Supporting source IDs (comma separated)", "ids"),
  textField("counterEvidence", "Counter-evidence / alternative explanation", "multiline"),
  textField("uncertainty", "Limitations and uncertainty", "multiline"),
  textField("nextCheck", "Next discriminating evidence check", "multiline"),
  { key: "disposition", label: "Challenge state", options: ["open", "included", "rejected"] },
];
