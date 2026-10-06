// Explicit reference model. The reference is NOT "the first data" and NOT assumed healthy:
// it is the median intensity of comparable operating months, with a confidence rating.
export type RefRow = { month: string; sec: number; production: number; operatingHours: number };

export type ReferenceConfidence = "high" | "medium" | "low" | "none";
export type EnvelopeState = "within" | "outside" | "insufficient" | "reference_uncertain" | "potential_degradation";

export type Reference = {
  sec: number | null;
  low: number | null;
  high: number | null;
  months: string[];
  method: string;
  confidence: ReferenceConfidence;
  reasons: string[];
  version: string;
};

export const REFERENCE_RULES = { hoursBand: 0.15, productionBand: 0.25, minBand: 0.03, madMultiplier: 1.5, version: "ref-v1" };

const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export function buildReference(rows: RefRow[]): Reference {
  const base = { method: "Median energy per unit of comparable operating months (production ±25%, hours ±15% of median)", version: REFERENCE_RULES.version };
  if (rows.length < 3) return { ...base, sec: null, low: null, high: null, months: [], confidence: "none", reasons: ["Fewer than 3 usable months — no defensible reference"] };
  const mh = median(rows.map((r) => r.operatingHours));
  const mp = median(rows.map((r) => r.production));
  const cand = rows.filter((r) => Math.abs(r.operatingHours / mh - 1) <= REFERENCE_RULES.hoursBand && Math.abs(r.production / mp - 1) <= REFERENCE_RULES.productionBand);
  const reasons: string[] = [];
  if (cand.length < 3) return { ...base, sec: null, low: null, high: null, months: cand.map((c) => c.month), confidence: "none", reasons: ["Fewer than 3 comparable operating months"] };
  const secs = cand.map((c) => c.sec);
  const ref = median(secs);
  const mad = median(secs.map((s) => Math.abs(s - ref)));
  const half = Math.max(REFERENCE_RULES.madMultiplier * mad, REFERENCE_RULES.minBand * ref);
  const mean = secs.reduce((a, b) => a + b, 0) / secs.length;
  const cv = Math.sqrt(secs.reduce((a, s) => a + (s - mean) ** 2, 0) / secs.length) / mean;
  let confidence: ReferenceConfidence = cand.length >= 6 && cv < 0.06 ? "high" : cand.length >= 4 && cv < 0.1 ? "medium" : "low";
  if (cand.length < 6) reasons.push(`${cand.length} comparable months (6+ preferred)`);
  if (cv >= 0.06) reasons.push(`Comparable months vary ${(cv * 100).toFixed(1)}% — reference less certain`);
  if (cand.length < rows.length) reasons.push(`${rows.length - cand.length} month(s) excluded as not comparable`);
  reasons.push("Reference describes past operation; it is not assumed to be healthy or optimal");
  if (confidence === "high" && rows.length < 9) confidence = "medium";
  return { ...base, sec: ref, low: ref - half, high: ref + half, months: cand.map((c) => c.month), confidence, reasons };
}

export function envelopeState(sec: number | null | undefined, ref: Reference, trailing: number[] = []): EnvelopeState {
  if (!sec || sec <= 0 || ref.sec === null || ref.high === null || ref.low === null) return "insufficient";
  if (ref.confidence === "low") return "reference_uncertain";
  const last = [...trailing, sec].slice(-3);
  if (last.length === 3 && last.every((x) => x > ref.high!) && last[0] < last[1] && last[1] < last[2]) return "potential_degradation";
  return sec > ref.high || sec < ref.low ? "outside" : "within";
}

export const ENVELOPE_LABEL: Record<EnvelopeState, string> = {
  within: "Within expected envelope",
  outside: "Outside expected envelope",
  insufficient: "Insufficient evidence",
  reference_uncertain: "Reference uncertain",
  potential_degradation: "Potential degradation",
};
