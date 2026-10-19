/**
 * Synthetic-only electricity bill fact capture — NOT extraction, a tariff engine,
 * a billing error determination, or permission to process customer documents.
 *
 * Values are transcribed as decimal strings so precision and units remain
 * visible to a qualified reviewer. Never infer a supplier, tariff, or saving.
 */
import { z } from "zod";
import { utilities } from "./contract";

const syntheticDocumentId = z.string().regex(/^SYN-[A-Z0-9-]{4,64}$/);
const validDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(value + "T00:00:00Z");
    return Number.isFinite(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
  }, "Use a real calendar date");
const decimal = z.string().regex(/^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/);
const sourceLocation = z.object({
  documentId: syntheticDocumentId,
  page: z.number().int().positive().max(10000),
  printedLabel: z.string().trim().min(1).max(120),
}).strict();

const demandNames = [
  "contract_demand",
  "recorded_maximum_demand",
  "billed_demand",
] as const;
const monetaryNames = ["demand_charge", "total_amount"] as const;

const demandFact = z.object({
  kind: z.literal("number"),
  name: z.enum(demandNames),
  decimal,
  unit: z.enum(["kW", "kVA"]),
  source: sourceLocation,
}).strict();
const monetaryFact = z.object({
  kind: z.literal("number"),
  name: z.enum(monetaryNames),
  decimal,
  unit: z.literal("INR"),
  source: sourceLocation,
}).strict();
const energyFact = z.object({
  kind: z.literal("number"),
  name: z.literal("energy_consumed"),
  decimal,
  unit: z.literal("kWh"),
  source: sourceLocation,
}).strict();
const powerFactorFact = z.object({
  kind: z.literal("number"),
  name: z.literal("power_factor"),
  decimal: decimal.refine((s) => Number(s) <= 1, "Power factor ratio must not exceed 1"),
  unit: z.literal("ratio"),
  source: sourceLocation,
}).strict();
const textFact = z.object({
  kind: z.literal("text"),
  name: z.enum(["tariff_category", "supply_voltage_label"]),
  value: z.string().trim().min(1).max(120),
  source: sourceLocation,
}).strict();

export const billFactSchema = z.union([
  demandFact,
  monetaryFact,
  energyFact,
  powerFactorFact,
  textFact,
]);

export const syntheticBillFactsSchema = z.object({
  contractVersion: z.literal("synthetic-bill-facts-v1"),
  sourceType: z.literal("synthetic"),
  reviewState: z.literal("unverified"),
  documentId: syntheticDocumentId,
  supplier: z.enum(utilities),
  billFrom: validDate,
  billTo: validDate,
  fields: z.array(billFactSchema).min(1).max(30),
}).strict().superRefine((bill, context) => {
  if (
    bill.billTo < bill.billFrom ||
    (Date.parse(bill.billTo) - Date.parse(bill.billFrom)) / 86400000 > 366
  ) {
    context.addIssue({ code: "custom", path: ["billTo"], message: "Invalid bill period" });
  }
  const seen = new Set<string>();
  bill.fields.forEach((field, index) => {
    if (field.source.documentId !== bill.documentId) {
      context.addIssue({
        code: "custom",
        path: ["fields", index, "source", "documentId"],
        message: "Fact source must match its synthetic bill",
      });
    }
    if (seen.has(field.name)) {
      context.addIssue({
        code: "custom",
        path: ["fields", index, "name"],
        message: "Duplicate observation: retain conflicting readings for human reconciliation",
      });
    }
    seen.add(field.name);
  });
});

export type SyntheticBillFacts = z.infer<typeof syntheticBillFactsSchema>;
export type BillFact = z.infer<typeof billFactSchema>;
export type CoverageIssue =
  | "SUPPLIER_UNKNOWN"
  | "TARIFF_CATEGORY_MISSING"
  | "CONTRACT_DEMAND_MISSING"
  | "RECORDED_DEMAND_MISSING"
  | "BILLED_DEMAND_MISSING"
  | "DEMAND_UNITS_NOT_COMPARABLE"
  | "POWER_FACTOR_NOT_OBSERVED"
  | "APPLICABLE_TARIFF_NOT_REVIEWED";

/**
 * Describes missing evidence, NOT a numerical calculation or screening decision.
 * A complete bill still requires a date-specific supplier tariff, contract and
 * professional review; no output may be customer-published as a finding.
 */
export function inspectSyntheticBillCoverage(input: unknown): {
  issues: CoverageIssue[];
  readyForTariffCalculation: false;
  reviewState: "unverified";
} {
  const bill = syntheticBillFactsSchema.parse(input);
  const issues: CoverageIssue[] = [];
  if (bill.supplier === "Unknown") issues.push("SUPPLIER_UNKNOWN");

  const fields = new Map(bill.fields.map((fact) => [fact.name, fact]));
  if (!fields.has("tariff_category")) issues.push("TARIFF_CATEGORY_MISSING");
  if (!fields.has("contract_demand")) issues.push("CONTRACT_DEMAND_MISSING");
  if (!fields.has("recorded_maximum_demand")) issues.push("RECORDED_DEMAND_MISSING");
  if (!fields.has("billed_demand")) issues.push("BILLED_DEMAND_MISSING");

  const demandFacts = demandNames
    .map((name) => fields.get(name))
    .filter((fact): fact is Extract<BillFact, { kind: "number" }> =>
      fact !== undefined && fact.kind === "number");
  if (new Set(demandFacts.map((fact) => fact.unit)).size > 1)
    issues.push("DEMAND_UNITS_NOT_COMPARABLE");

  if (!fields.has("power_factor")) issues.push("POWER_FACTOR_NOT_OBSERVED");
  // A field copied from a bill is NOT a professionally verified tariff rule.
  issues.push("APPLICABLE_TARIFF_NOT_REVIEWED");

  return { issues, readyForTariffCalculation: false, reviewState: "unverified" };
}
