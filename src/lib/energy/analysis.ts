import type {
  Alert,
  Confidence,
  Equipment,
  EquipmentCategory,
  Factory,
  Intervention,
  MonthRecord,
  Opportunity,
} from "./types";
import { inr, num, pct, monthLabel } from "./format";
import { validateMonths, type PipelineResult } from "./pipeline";
import { buildReference, type Reference } from "./reference";

// All assumptions in one place so the engine is transparent and auditable.
export const ASSUMPTIONS = {
  minBillingDemandPct: 0.85, // billed demand floor as share of contract demand
  contractHeadroom: 1.1, // recommended contract = max peak x headroom
  excessDemandPenaltyMultiplier: 1, // extra charge on kVA above contract (i.e. billed at 2x)
  pfTarget: 0.95,
  pfPenaltyPerPoint: 0.01, // 1% of bill per 0.01 PF below target
  secRecoverableShare: 0.4, // share of SEC drift considered recoverable
  apfcCostPerKvar: 1200,
  secAlertThreshold: 1.08,
};

export type MonthRow = MonthRecord & {
  sec: number;
  costPerKwh: number;
  utilization: number;
  billedKva: number;
};

export type DataQuality = { score: number; grade: "Good" | "Fair" | "Limited"; issues: string[] };

export type Analysis = {
  hasData: boolean;
  rows: MonthRow[];
  latest?: MonthRow;
  prev?: MonthRow;
  avgRate: number;
  baselineSec: number;
  annualFactor: number;
  totalKwh: number;
  totalCost: number;
  maxPeak: number;
  opportunities: Opportunity[];
  alerts: Alert[];
  quality: DataQuality;
  totalSavingAnnual: number;
  pipeline: PipelineResult;
  reference: Reference;
  paused: boolean;
};

export const equipmentKwh = (e: Equipment) => e.ratedKw * e.quantity * e.hoursPerMonth * e.loadFactor;

const EQUIP_RULES: Partial<
  Record<
    EquipmentCategory,
    {
      lossShare: number;
      recoverable: number;
      capexPerKw: number;
      title: string;
      problem: string;
      cause: string;
      action: string;
      confidence: Confidence;
    }
  >
> = {
  compressor: {
    lossShare: 0.2,
    recoverable: 0.7,
    capexPerKw: 1300,
    title: "Compressed air leaks & over-pressure",
    problem: "Compressors draw more power than production air demand requires.",
    cause: "Typical plants lose 20–30% of compressed air to leaks and run headers above required pressure.",
    action: "Ultrasonic leak survey, fix top leaks, reduce header pressure by 0.5–1 bar, add sequencer.",
    confidence: "medium",
  },
  motor: {
    lossShare: 0.12,
    recoverable: 0.6,
    capexPerKw: 3500,
    title: "Part-loaded motors, pumps & fans",
    problem: "Motors run at fixed speed while load varies.",
    cause: "Throttled pumps/fans and oversized IE1/IE2 motors waste energy at partial load.",
    action: "Install VFDs on pumps/fans with variable demand; replace failed motors with IE3/IE4.",
    confidence: "medium",
  },
  furnace: {
    lossShare: 0.1,
    recoverable: 0.5,
    capexPerKw: 700,
    title: "Furnace idle & thermal losses",
    problem: "Heat-treatment furnaces consume energy during idle and warm-up.",
    cause: "Idle holding between batches and degraded insulation/coil efficiency.",
    action: "Batch scheduling to cut idle hours, coil & insulation audit, idle power-down SOP.",
    confidence: "low",
  },
  hvac: {
    lossShare: 0.2,
    recoverable: 0.6,
    capexPerKw: 2000,
    title: "HVAC setpoint & airflow control",
    problem: "HVAC runs at full airflow regardless of booth usage.",
    cause: "No occupancy/usage interlock and fixed-speed fans.",
    action: "Interlock HVAC with booth operation, VFD on supply fan, setpoint review.",
    confidence: "medium",
  },
  lighting: {
    lossShare: 0.55,
    recoverable: 0.9,
    capexPerKw: 9000,
    title: "Legacy lighting",
    problem: "Conventional fixtures consume ~2x the power of LED for the same light.",
    cause: "HPMV/T8 fixtures and lights left on in idle areas.",
    action: "Retrofit to LED high-bays with daylight/occupancy sensors.",
    confidence: "high",
  },
};

function bySavings(a: Opportunity, b: Opportunity) {
  return b.savingAnnual - a.savingAnnual;
}

export function analyze(f: Factory, now: Date = new Date()): Analysis {
  const pipeline = validateMonths(f.months, now);
  const sorted = pipeline.usable;
  const C = f.contractDemandKva;
  const rows: MonthRow[] = sorted.map((m) => ({
    ...m,
    sec: m.production > 0 ? m.kwh / m.production : 0,
    costPerKwh: m.kwh > 0 ? m.cost / m.kwh : 0,
    utilization: C > 0 && Number.isFinite(m.peakKva) && m.peakKva > 0 ? m.peakKva / C : 0,
    // A missing peak is not a zero peak. Demand claims are gated on complete
    // peak coverage below; this placeholder is never used to infer savings.
    billedKva: Number.isFinite(m.peakKva) ? Math.max(m.peakKva, ASSUMPTIONS.minBillingDemandPct * C) : Number.NaN,
  }));
  const quality = assessQuality(f, rows, pipeline);
  // Only rows with known operating hours can be compared on operating context.
  // Missing context in one month must not poison every otherwise comparable month.
  const referenceRows = rows.filter((r) => Number.isFinite(r.operatingHours) && r.operatingHours > 0);
  const reference = buildReference(referenceRows);
  const empty = { avgRate: 0, baselineSec: 0, annualFactor: 0, totalKwh: 0, totalCost: 0, maxPeak: 0, opportunities: [], alerts: [], totalSavingAnnual: 0 };

  if (rows.length === 0) return { hasData: false, rows, quality, pipeline, reference, paused: pipeline.analysisPaused, ...empty };
  if (pipeline.analysisPaused) {
    // Fail closed: show the data, suppress conclusions.
    return { hasData: true, rows, latest: rows.at(-1), prev: rows.at(-2), quality, pipeline, reference, paused: true, ...empty };
  }

  const n = rows.length;
  const annualFactor = 12 / n;
  const totalKwh = rows.reduce((s, r) => s + r.kwh, 0);
  const totalCost = rows.reduce((s, r) => s + r.cost, 0);
  const avgRate = totalKwh > 0 ? totalCost / totalKwh : 0;
  const peakRows = rows.filter((r) => Number.isFinite(r.peakKva) && r.peakKva >= 0);
  const peakCoverageComplete = peakRows.length === rows.length;
  const maxPeak = peakRows.length ? Math.max(...peakRows.map((r) => r.peakKva)) : 0;
  // Reference = comparable-operation median (see reference.ts), not best months or first months.
  const baselineSec = reference.sec ?? 0;
  const dr = f.demandChargePerKva;
  const opps: Opportunity[] = [];
  const dataConf: Confidence = n >= 12 ? "high" : n >= 6 ? "medium" : "low";

  // 1. Contract demand optimisation
  // Demand recommendations require peak measurements for every analyzed
  // month. Partial coverage cannot support a defensible maximum or annualized claim.
  if (C > 0 && dr > 0 && peakCoverageComplete) {
    const rec = Math.ceil((maxPeak * ASSUMPTIONS.contractHeadroom) / 10) * 10;
    if (rec < C) {
      const fl = ASSUMPTIONS.minBillingDemandPct;
      const monthly = rows.map((r) => Math.max(r.peakKva, fl * C) - Math.max(r.peakKva, fl * rec));
      const saved = monthly.reduce((s, x) => s + x, 0) * dr * annualFactor;
      if (saved > 0) {
        opps.push({
          id: "contract-demand",
          title: "Contract demand set too high",
          category: "demand",
          problem: `Paying for ${num(fl * C)} kVA minimum billed demand while actual peak never exceeded ${num(maxPeak)} kVA.`,
          cause: `Contract demand of ${num(C)} kVA is ${pct(maxPeak / C)} utilised at peak; utility bills at least ${pct(fl)} of contract.`,
          action: `Apply to DISCOM to revise contract demand to ~${num(rec)} kVA (${pct(ASSUMPTIONS.contractHeadroom - 1)} headroom over max peak).`,
          impactAnnual: saved,
          savingAnnual: saved,
          investment: 0,
          paybackMonths: 0,
          confidence: dataConf,
          calc: [
            `Max recorded peak = ${num(maxPeak)} kVA over ${n} months`,
            `Recommended contract = ceil(${num(maxPeak)} × ${ASSUMPTIONS.contractHeadroom}) = ${num(rec)} kVA`,
            `Billed demand = max(actual peak, ${pct(fl)} × contract)`,
            `Σ billed-kVA reduction × ${inr(dr)}/kVA × ${annualFactor.toFixed(2)} (annualised) = ${inr(saved)}/yr`,
          ],
        });
      }
    }
    // 2. Exceedance penalties
    const exc = rows.filter((r) => r.peakKva > C);
    if (exc.length) {
      const excessKva = exc.reduce((s, r) => s + (r.peakKva - C), 0);
      const loss = excessKva * dr * ASSUMPTIONS.excessDemandPenaltyMultiplier * annualFactor;
      opps.push({
        id: "demand-exceedance",
        title: "Peak demand exceeding contract",
        category: "demand",
        problem: `Peak exceeded contract demand in ${exc.length} month(s), attracting penal demand charges.`,
        cause: "Simultaneous start-up of large loads (furnaces, compressors, presses) during the same interval.",
        action: "Stagger large-load start-ups, add a demand controller with load-shedding priority list.",
        impactAnnual: loss,
        savingAnnual: loss * 0.8,
        investment: 250000,
        paybackMonths: loss > 0 ? 250000 / ((loss * 0.8) / 12) : null,
        confidence: dataConf,
        calc: [
          `Excess kVA summed across months = ${num(excessKva)} kVA`,
          `Penalty assumed at ${ASSUMPTIONS.excessDemandPenaltyMultiplier + 1}× demand rate on excess`,
          `Annualised loss = ${inr(loss)}; 80% assumed avoidable with load scheduling`,
        ],
      });
    }
  }

  // 3. Power factor
  const pfRows = rows.filter((r) => Number.isFinite(r.powerFactor) && (r.powerFactor ?? 0) > 0);
  const pfCoverageComplete = pfRows.length === rows.length;
  const hoursCoverageComplete = rows.every((r) => Number.isFinite(r.operatingHours) && r.operatingHours > 0);
  if (pfRows.length && pfCoverageComplete && hoursCoverageComplete) {
    const avgPf = pfRows.reduce((s, r) => s + (r.powerFactor ?? 0), 0) / pfRows.length;
    if (avgPf < ASSUMPTIONS.pfTarget) {
      const penaltyShare = ((ASSUMPTIONS.pfTarget - avgPf) / 0.01) * ASSUMPTIONS.pfPenaltyPerPoint;
      const loss = (totalCost * annualFactor) * penaltyShare;
      const avgKw = totalKwh / Math.max(1, rows.reduce((s, r) => s + r.operatingHours, 0));
      const kvar = avgKw * (Math.tan(Math.acos(avgPf)) - Math.tan(Math.acos(0.98)));
      const inv = Math.round(kvar * ASSUMPTIONS.apfcCostPerKvar);
      opps.push({
        id: "power-factor",
        title: "Low power factor",
        category: "tariff",
        problem: `Average power factor ${avgPf.toFixed(3)} is below the ${ASSUMPTIONS.pfTarget} target.`,
        cause: "Inductive loads (motors, induction furnaces) without adequate or healthy capacitor compensation.",
        action: `Service/upgrade APFC panel — roughly ${num(kvar)} kVAr to reach 0.98.`,
        impactAnnual: loss,
        savingAnnual: loss,
        investment: inv,
        paybackMonths: loss > 0 ? inv / (loss / 12) : null,
        confidence: "medium",
        calc: [
          `Avg PF = ${avgPf.toFixed(3)} across ${pfRows.length} months`,
          `Assumed tariff penalty ${pct(ASSUMPTIONS.pfPenaltyPerPoint)} of bill per 0.01 below ${ASSUMPTIONS.pfTarget} → ${pct(penaltyShare, 1)}`,
          `Avg load ≈ ${num(avgKw)} kW → kVAr = kW × (tan φ₁ − tan φ₂) = ${num(kvar)}`,
          `Investment at ${inr(ASSUMPTIONS.apfcCostPerKvar)}/kVAr = ${inr(inv)}`,
        ],
      });
    }
  }

  // 4. Specific energy drift
  if (baselineSec > 0 && reference.high !== null) {
    // Only months above the expected envelope contribute; excess measured against the reference median.
    const excessKwh = rows.filter((r) => r.sec > (reference.high ?? Infinity)).reduce((s, r) => s + Math.max(0, (r.sec - baselineSec) * r.production), 0);
    const loss = excessKwh * avgRate * annualFactor;
    if (loss > 0) {
      const sav = loss * ASSUMPTIONS.secRecoverableShare;
      opps.push({
        id: "sec-drift",
        title: "Energy per unit above the expected operating envelope",
        category: "process",
        problem: `Some months used more kWh per ${f.productUnit} than the plant's own comparable-operation reference.`,
        cause: "Idle running between shifts, longer furnace hold times, seasonal cooling load, or process inefficiency.",
        action: "Shift-wise energy log for top 3 loads, idle shutdown SOP, review high-SEC months with production team.",
        impactAnnual: loss,
        savingAnnual: sav,
        investment: 50000,
        paybackMonths: sav > 0 ? 50000 / (sav / 12) : null,
        confidence: reference.confidence === "high" ? "medium" : "low",
        calc: [
          `Reference SEC (median of ${reference.months.length} comparable months) = ${baselineSec.toFixed(3)} kWh/${f.productUnit}; envelope ${reference.low?.toFixed(3)}–${reference.high?.toFixed(3)} (${reference.confidence} confidence)`,
          `Excess kWh = Σ over months above envelope of (SEC − reference) × production = ${num(excessKwh)} kWh`,
          `× avg rate ${inr(avgRate)}/kWh, annualised = ${inr(loss)}/yr`,
          `Assumed recoverable share ${pct(ASSUMPTIONS.secRecoverableShare)} → ${inr(sav)}/yr`,
        ],
      });
    }
  }

  // 5. Equipment-based opportunities
  const cats = new Set(f.equipment.map((e) => e.category));
  for (const cat of cats) {
    const rule = EQUIP_RULES[cat];
    if (!rule) continue;
    const list = f.equipment.filter((e) => e.category === cat);
    const kwhM = list.reduce((s, e) => s + equipmentKwh(e), 0);
    const kw = list.reduce((s, e) => s + e.ratedKw * e.quantity, 0);
    const loss = kwhM * rule.lossShare * 12 * avgRate;
    const sav = loss * rule.recoverable;
    const inv = Math.round(kw * rule.capexPerKw);
    if (sav <= 0) continue;
    opps.push({
      id: `equip-${cat}`,
      title: rule.title,
      category: "equipment",
      problem: rule.problem,
      cause: rule.cause,
      action: rule.action,
      impactAnnual: loss,
      savingAnnual: sav,
      investment: inv,
      paybackMonths: inv / (sav / 12),
      confidence: rule.confidence,
      calc: [
        `Estimated consumption = Σ kW × qty × hours × load factor = ${num(kwhM)} kWh/month`,
        `Typical loss share ${pct(rule.lossShare)} → ${num(kwhM * rule.lossShare)} kWh/month`,
        `× 12 × ${inr(avgRate)}/kWh = ${inr(loss)}/yr; recoverable ${pct(rule.recoverable)}`,
        `Indicative capex ${inr(rule.capexPerKw)}/kW × ${num(kw)} kW = ${inr(inv)}`,
      ],
    });
  }

  opps.sort(bySavings);
  const alerts = buildAlerts(f, rows, baselineSec, avgRate);
  const totalSavingAnnual = opps
    .filter((o) => f.opportunityStatus[o.id] !== "implemented")
    .reduce((s, o) => s + o.savingAnnual, 0);

  return {
    hasData: true, rows, latest: rows[n - 1], prev: rows[n - 2], avgRate, baselineSec, annualFactor,
    totalKwh, totalCost, maxPeak, opportunities: opps, alerts, quality, totalSavingAnnual, pipeline, reference, paused: false,
  };
}

function buildAlerts(f: Factory, rows: MonthRow[], baselineSec: number, avgRate: number): Alert[] {
  const out: Alert[] = [];
  const C = f.contractDemandKva;
  rows.forEach((r, i) => {
    const p = rows[i - 1];
    const ml = monthLabel(r.month);
    if (C > 0 && r.peakKva > C) {
      out.push({ id: `exc-${r.month}`, severity: "critical", month: r.month, title: "Peak demand exceeded contract",
        detail: `${num(r.peakKva)} kVA vs ${num(C)} kVA contract in ${ml}.`,
        impactInr: (r.peakKva - C) * f.demandChargePerKva * ASSUMPTIONS.excessDemandPenaltyMultiplier });
    } else if (C > 0 && r.utilization >= 0.95) {
      out.push({ id: `near-${r.month}`, severity: "warning", month: r.month, title: "Peak within 5% of contract demand",
        detail: `${pct(r.utilization)} utilisation — one more large load start could trigger penalties.` });
    }
    if (baselineSec > 0 && r.sec > baselineSec * ASSUMPTIONS.secAlertThreshold) {
      out.push({ id: `sec-${r.month}`, severity: "warning", month: r.month, title: "Energy per unit above benchmark",
        detail: `${r.sec.toFixed(2)} vs ${baselineSec.toFixed(2)} kWh/${f.productUnit} (+${pct(r.sec / baselineSec - 1)}).`,
        impactInr: (r.sec - baselineSec) * r.production * avgRate });
    }
    if (p && p.kwh > 0 && p.production > 0) {
      const kg = r.kwh / p.kwh - 1;
      const pg = r.production / p.production - 1;
      if (kg > 0.12 && pg < 0.05) {
        out.push({ id: `spike-${r.month}`, severity: "warning", month: r.month, title: "Consumption spike without production increase",
          detail: `kWh +${pct(kg)} while production ${pg >= 0 ? "+" : ""}${pct(pg)} vs previous month.` });
      }
      if (p.costPerKwh > 0 && r.costPerKwh / p.costPerKwh - 1 > 0.04) {
        out.push({ id: `rate-${r.month}`, severity: "info", month: r.month, title: "Effective ₹/kWh increased",
          detail: `₹${p.costPerKwh.toFixed(2)} → ₹${r.costPerKwh.toFixed(2)}/kWh. Check tariff revision or demand charges.`,
          impactInr: (r.costPerKwh - p.costPerKwh) * r.kwh });
      }
    }
    if (r.powerFactor && r.powerFactor < 0.92) {
      out.push({ id: `pf-${r.month}`, severity: "warning", month: r.month, title: "Low power factor",
        detail: `PF ${r.powerFactor.toFixed(2)} in ${ml} — likely attracting PF penalty.` });
    }
  });
  const rank = { critical: 0, warning: 1, info: 2 };
  return out.sort((a, b) => b.month.localeCompare(a.month) || rank[a.severity] - rank[b.severity]);
}

function assessQuality(f: Factory, rows: MonthRow[], pipeline: PipelineResult): DataQuality {
  const issues: string[] = [];
  const inputRows = f.months;
  const usableCount = rows.length;
  let score = (Math.min(usableCount, 12) / 12) * 35;

  if (usableCount < 12) issues.push(`${usableCount} usable of 12 recommended months`);
  if (inputRows.length === 0) {
    issues.push("No monthly observations entered");
  } else {
    // Measure completeness across every submitted row, not only rows that
    // survived validation. Otherwise excluded rows make the remaining dataset
    // look artificially clean.
    const complete = inputRows.filter((r) =>
      Number.isFinite(r.kwh) && Number.isFinite(r.cost) && Number.isFinite(r.peakKva) &&
      Number.isFinite(r.production) && Number.isFinite(r.operatingHours)
    ).length / inputRows.length;
    const pfShare = inputRows.filter((r) => Number.isFinite(r.powerFactor) && (r.powerFactor ?? 0) > 0).length / inputRows.length;
    score += complete * 20 + pfShare * 5;
    if (complete < 1) issues.push("Some entered months have missing required measurements");
    if (pfShare < 1) issues.push("Power factor missing for some months");
  }

  const flaggedRows = pipeline.checks.filter((check) => check.states.some((state) => state !== "GOOD"));
  if (flaggedRows.length) issues.push(`${flaggedRows.length} entered month(s) have data-quality flags`);
  if (pipeline.stale) issues.push("Most recent usable data is stale");
  if (f.contractDemandKva > 0 && f.demandChargePerKva > 0) score += 5;
  else issues.push("Contract demand or demand charge not set");

  if (f.equipment.length) {
    score += 15;
    if (usableCount) {
      const eq = f.equipment.reduce((s, e) => s + equipmentKwh(e), 0);
      const avg = rows.reduce((s, r) => s + r.kwh, 0) / usableCount;
      const ratio = avg > 0 ? eq / avg : Number.NaN;
      if (Number.isFinite(ratio) && ratio >= 0.6 && ratio <= 1.1) score += 20;
      else {
        score += 8;
        issues.push(Number.isFinite(ratio)
          ? `Equipment list explains ${pct(ratio)} of usable-row billed kWh (expected 60–110%)`
          : "Equipment-to-bill comparison unavailable");
      }
    } else {
      issues.push("Equipment-to-bill comparison unavailable without usable monthly data");
    }
  } else {
    issues.push("No major equipment listed");
  }

  score = Math.round(Math.min(100, score));
  return { score, grade: score >= 75 ? "Good" : score >= 50 ? "Fair" : "Limited", issues };
}

export type Verification = {
  intervention: Intervention;
  ok: boolean;
  reason?: string;
  preMonths: MonthRow[];
  postMonths: MonthRow[];
  baselineSec: number;
  postSec: number;
  expectedKwh: number;
  actualKwh: number;
  savedKwh: number;
  savedInr: number;
  annualisedInr: number;
  paybackMonths: number | null;
  // verified_candidate still requires non-demo data and acceptance before being labelled Verified.
  status?: "insufficient" | "rejected" | "not_significant" | "verified_candidate";
  uncertaintyKwh?: number;
};

// Baseline-adjusted (production-normalised) savings, IPMVP Option C style simplified.
export function verifyIntervention(rows: MonthRow[], iv: Intervention): Verification {
  const pre = rows.filter((r) => r.month < iv.implementedMonth).slice(-6);
  const post = rows.filter((r) => r.month > iv.implementedMonth);
  const base: Verification = {
    intervention: iv, ok: false, preMonths: pre, postMonths: post, baselineSec: 0, postSec: 0,
    expectedKwh: 0, actualKwh: 0, savedKwh: 0, savedInr: 0, annualisedInr: 0, paybackMonths: null,
  };
  if (pre.length < 3) return { ...base, reason: "Need at least 3 months of data before the intervention." };
  if (post.length < 1) return { ...base, reason: "Waiting for post-intervention months." };
  const preKwh = pre.reduce((s, r) => s + r.kwh, 0);
  const preProd = pre.reduce((s, r) => s + r.production, 0);
  const baselineSec = preKwh / preProd;
  const postProd = post.reduce((s, r) => s + r.production, 0);
  const actualKwh = post.reduce((s, r) => s + r.kwh, 0);
  const expectedKwh = baselineSec * postProd;
  const postCost = post.reduce((s, r) => s + r.cost, 0);
  const rate = postCost / actualKwh;
  const savedKwh = expectedKwh - actualKwh;
  const savedInr = savedKwh * rate;
  const annualisedInr = (savedInr / post.length) * 12;
  // Significance: saving must exceed 2× the baseline month-to-month variability scaled to post production.
  const preSecs = pre.map((r) => r.sec);
  const sd = Math.sqrt(preSecs.reduce((s, x) => s + (x - baselineSec) ** 2, 0) / preSecs.length);
  const uncertaintyKwh = 2 * sd * postProd / Math.sqrt(post.length);
  const status: Verification["status"] = post.length < 3 ? "insufficient" : savedKwh <= 0 ? "rejected" : savedKwh > uncertaintyKwh ? "verified_candidate" : "not_significant";
  return {
    ...base, ok: true, baselineSec, postSec: actualKwh / postProd, expectedKwh, actualKwh, savedKwh, savedInr,
    annualisedInr, paybackMonths: savedInr > 0 ? iv.cost / (savedInr / post.length) : null, status, uncertaintyKwh,
  };
}
