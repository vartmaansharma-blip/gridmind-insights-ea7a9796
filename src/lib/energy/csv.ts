import { z } from "zod";
import type { MonthRecord } from "./types";

// Import adapter: CSV → MonthRecord[]. Future meter/API adapters should
// produce the same MonthRecord shape.
export const CSV_HEADER = "month,kwh,cost,peak_kva,production,operating_hours,power_factor";

// Blank numeric cells become the existing missing-value sentinel (NaN), not zero.
// Malformed nonblank cells still fail validation. The quality pipeline then marks
// partial records as MISSING while preserving the rest of the submitted month.
const numericCell = (max: number, label: string) =>
  z.string().trim()
    .transform((raw) => ({ raw, value: raw === "" ? Number.NaN : Number(raw) }))
    .refine(({ raw, value }) => raw === "" || (Number.isFinite(value) && value >= 0 && value <= max),
      `${label} must be a number between 0 and ${max}`)
    .transform(({ value }) => value);

const rowSchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "month must be YYYY-MM"),
  kwh: numericCell(1e9, "kWh"),
  cost: numericCell(1e11, "Cost"),
  peakKva: numericCell(1e6, "Peak kVA"),
  production: numericCell(1e10, "Production"),
  operatingHours: numericCell(744, "Operating hours"),
  powerFactor: z.string().trim()
    .transform((raw) => ({ raw, value: raw === "" ? undefined : Number(raw) }))
    .refine(({ raw, value }) => raw === "" || (value !== undefined && Number.isFinite(value) && value > 0 && value <= 1),
      "Power factor must be greater than 0 and at most 1")
    .transform(({ value }) => value)
    .optional(),
});

export function parseMonthlyCsv(text: string): { rows: MonthRecord[]; errors: string[] } {
  const lines = text.trim().split(/\r?\n/).filter(Boolean).slice(0, 240);
  const errors: string[] = [];
  const rows: MonthRecord[] = [];
  lines.forEach((line, i) => {
    if (i === 0 && /month/i.test(line)) return;
    const c = line.split(",").map((x) => x.trim());
    const r = rowSchema.safeParse({
      month: c[0], kwh: c[1], cost: c[2], peakKva: c[3], production: c[4], operatingHours: c[5],
      powerFactor: c[6] ? c[6] : undefined,
    });
    if (r.success) rows.push(r.data);
    else errors.push(`Line ${i + 1}: ${r.error.issues[0]?.message ?? "invalid"}`);
  });
  return { rows, errors };
}
