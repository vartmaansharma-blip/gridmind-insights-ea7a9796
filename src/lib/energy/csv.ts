import { z } from "zod";
import type { MonthRecord } from "./types";

// Import adapter: CSV → MonthRecord[]. Future meter/API adapters should
// produce the same MonthRecord shape.
export const CSV_HEADER = "month,kwh,cost,peak_kva,production,operating_hours,power_factor";

const rowSchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "month must be YYYY-MM"),
  kwh: z.coerce.number().min(0).max(1e9),
  cost: z.coerce.number().min(0).max(1e11),
  peakKva: z.coerce.number().min(0).max(1e6),
  production: z.coerce.number().min(0).max(1e10),
  operatingHours: z.coerce.number().min(0).max(744),
  powerFactor: z.coerce.number().min(0).max(1).optional(),
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
