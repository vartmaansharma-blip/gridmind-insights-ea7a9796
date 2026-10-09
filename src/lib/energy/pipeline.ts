// INGEST → VALIDATE → NORMALIZE → QUALITY SCORE → STORE → ANALYZE
// Deterministic validation of monthly records. Missing data is never treated as zero:
// rows missing energy, cost or production are excluded from intensity calculations.
import type { MonthRecord } from "./types";

export const QUALITY_STATES = ["GOOD", "SUSPECT", "INVALID", "STALE", "MISSING", "INSUFFICIENT", "DUPLICATE", "OUT_OF_ORDER", "CALIBRATION_REQUIRED"] as const;
export type QualityState = (typeof QUALITY_STATES)[number];

export type RowCheck = { index: number; month: string; states: QualityState[]; notes: string[]; usable: boolean };

export type PipelineResult = {
  checks: RowCheck[];
  usable: MonthRecord[]; // sorted, de-duplicated, analysable
  counts: Record<QualityState, number>;
  stale: boolean;
  analysisPaused: boolean;
  pauseReason?: string;
};

export const PIPELINE_RULES = {
  minUsableMonths: 3,
  tariffLow: 3, // ₹/kWh outside this band is suspect for Indian industrial tariffs
  tariffHigh: 20,
  intensityOutlierFactor: 3,
  staleAfterMonths: 3,
  maxHours: 744,
};

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const finite = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);
const monthIndex = (m: string) => Number(m.slice(0, 4)) * 12 + Number(m.slice(5, 7)) - 1;

export function validateMonths(months: MonthRecord[], now: Date = new Date()): PipelineResult {
  const seen = new Set<string>();
  let prev = "";
  const checks: RowCheck[] = months.map((m, index) => {
    const states = new Set<QualityState>();
    const notes: string[] = [];
    if (!MONTH_RE.test(m.month ?? "")) { states.add("INVALID"); notes.push("Month must be YYYY-MM"); }
    else {
      if (seen.has(m.month)) { states.add("DUPLICATE"); notes.push("Duplicate month — first occurrence kept, this row excluded"); }
      if (prev && m.month < prev && !seen.has(m.month)) { states.add("OUT_OF_ORDER"); notes.push("Entered out of chronological order — sorted before analysis"); }
      seen.add(m.month);
      prev = m.month > prev ? m.month : prev;
    }
    for (const [k, label] of [["kwh", "energy (kWh)"], ["cost", "cost"], ["production", "production"]] as const) {
      const v = m[k];
      if (!finite(v)) { states.add("MISSING"); notes.push(`${label} was not provided`); }
      else if (v < 0) { states.add("INVALID"); notes.push(`${label} is negative`); }
      else if (v === 0 && (k === "kwh" || k === "production")) {
        states.add("INSUFFICIENT");
        notes.push(`${label} is a recorded zero; energy-intensity analysis is unavailable for this month`);
      }
    }
    if (!finite(m.peakKva)) { states.add("MISSING"); notes.push("Peak demand was not provided — demand checks skip this month"); }
    if (!finite(m.operatingHours)) { states.add("MISSING"); notes.push("Operating hours were not provided"); }
    else if (m.operatingHours === 0) { states.add("INSUFFICIENT"); notes.push("Operating hours are zero; operating-context comparisons are unavailable"); }
    else if (m.operatingHours > PIPELINE_RULES.maxHours) { states.add("INVALID"); notes.push("Operating hours exceed hours in a month"); }
    if (m.powerFactor !== undefined) {
      if (!finite(m.powerFactor)) { states.add("MISSING"); notes.push("Power factor was not provided"); }
      else if (m.powerFactor <= 0 || m.powerFactor > 1) { states.add("INVALID"); notes.push("Power factor must be greater than 0 and at most 1"); }
    }
    if (finite(m.kwh) && finite(m.cost) && m.kwh > 0 && m.cost > 0) {
      const rate = m.cost / m.kwh;
      if (rate < PIPELINE_RULES.tariffLow || rate > PIPELINE_RULES.tariffHigh) { states.add("SUSPECT"); notes.push(`Effective rate ₹${rate.toFixed(2)}/kWh is outside the expected band`); }
    }
    const core = !states.has("INVALID") && !states.has("DUPLICATE") &&
      finite(m.kwh) && finite(m.cost) && finite(m.production) &&
      m.kwh > 0 && m.cost >= 0 && m.production > 0;
    if (states.size === 0) states.add("GOOD");
    return { index, month: m.month, states: [...states], notes, usable: core };
  });

  // Intensity outliers relative to the median of usable rows (flag, do not drop).
  const usableIdx = checks.filter((c) => c.usable).map((c) => c.index);
  const secs = usableIdx.map((i) => months[i].kwh / months[i].production).sort((a, b) => a - b);
  const med = secs.length ? secs[Math.floor(secs.length / 2)] : 0;
  for (const i of usableIdx) {
    const s = months[i].kwh / months[i].production;
    if (med > 0 && (s > med * PIPELINE_RULES.intensityOutlierFactor || s < med / PIPELINE_RULES.intensityOutlierFactor)) {
      const c = checks[i];
      c.states = c.states.filter((x) => x !== "GOOD").concat("SUSPECT");
      c.notes.push("Energy per unit is far from the plant median — verify meter and production entries");
    }
  }

  const usable = usableIdx.map((i) => months[i]).sort((a, b) => a.month.localeCompare(b.month));
  const latest = usable.at(-1)?.month;
  const nowIdx = now.getUTCFullYear() * 12 + now.getUTCMonth();
  const stale = latest ? nowIdx - monthIndex(latest) > PIPELINE_RULES.staleAfterMonths : false;
  if (stale && latest) {
    const c = checks.find((x) => x.month === latest && x.usable);
    if (c) { c.states = c.states.filter((x) => x !== "GOOD").concat("STALE"); c.notes.push("Most recent usable data is more than 3 months old"); }
  }
  const counts = Object.fromEntries(QUALITY_STATES.map((s) => [s, 0])) as Record<QualityState, number>;
  checks.forEach((c) => c.states.forEach((s) => counts[s]++));
  const analysisPaused = usable.length < PIPELINE_RULES.minUsableMonths;
  return {
    checks, usable, counts, stale, analysisPaused,
    pauseReason: analysisPaused ? `Analysis paused — measurement quality insufficient: ${usable.length} usable month(s), at least ${PIPELINE_RULES.minUsableMonths} required.` : undefined,
  };
}
