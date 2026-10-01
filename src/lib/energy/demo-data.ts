import type { Factory, MonthRecord } from "./types";

// Fictional demo factory. NOT a real customer. Numbers are synthetic but
// generated deterministically so every visitor sees the same results.
export const DEMO_FACTORY_ID = "demo-adityapur";

const months = [
  "2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03",
  "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09",
];
const production = [198000, 204000, 211000, 190000, 207000, 215000, 201000, 196000, 210000, 218000, 222000, 214000];
const sec = [4.3, 4.28, 4.25, 4.32, 4.35, 4.52, 4.68, 4.71, 4.55, 4.18, 4.12, 4.1];
const peak = [1180, 1195, 1210, 1150, 1220, 1260, 1295, 1310, 1240, 1205, 1215, 1198];
const hours = [560, 580, 600, 540, 590, 610, 600, 590, 600, 610, 620, 600];
const pf = [0.93, 0.93, 0.92, 0.94, 0.93, 0.91, 0.9, 0.9, 0.92, 0.94, 0.95, 0.95];
const CONTRACT = 1750;
const DEMAND_RATE = 450;
const ENERGY_RATE = [6.85, 6.85, 6.85, 6.85, 6.85, 6.85, 7.2, 7.2, 7.2, 7.2, 7.2, 7.2];

export function createDemoFactory(): Factory {
  const rows: MonthRecord[] = months.map((m, i) => {
    const kwh = Math.round(production[i] * sec[i]);
    const billed = Math.max(peak[i], 0.85 * CONTRACT);
    return {
      month: m,
      kwh,
      cost: Math.round(kwh * ENERGY_RATE[i] + billed * DEMAND_RATE),
      peakKva: peak[i],
      production: production[i],
      operatingHours: hours[i],
      powerFactor: pf[i],
    };
  });
  return {
    id: DEMO_FACTORY_ID,
    name: "Adityapur Precision Auto Components",
    location: "Adityapur Industrial Area, Jharkhand",
    sector: "Auto components — machining, forging & heat treatment",
    productUnit: "component",
    contractDemandKva: CONTRACT,
    demandChargePerKva: DEMAND_RATE,
    isDemo: true,
    months: rows,
    equipment: [
      { id: "e1", name: "Screw air compressors", category: "compressor", ratedKw: 75, quantity: 4, hoursPerMonth: 600, loadFactor: 0.75 },
      { id: "e2", name: "Induction hardening furnaces", category: "furnace", ratedKw: 250, quantity: 2, hoursPerMonth: 550, loadFactor: 0.6 },
      { id: "e3", name: "CNC machining line motors", category: "motor", ratedKw: 15, quantity: 40, hoursPerMonth: 600, loadFactor: 0.55 },
      { id: "e4", name: "Press shop drives", category: "motor", ratedKw: 37, quantity: 12, hoursPerMonth: 560, loadFactor: 0.5 },
      { id: "e5", name: "Cooling tower pumps & fans", category: "motor", ratedKw: 30, quantity: 6, hoursPerMonth: 650, loadFactor: 0.7 },
      { id: "e6", name: "Paint booth HVAC", category: "hvac", ratedKw: 180, quantity: 1, hoursPerMonth: 500, loadFactor: 0.65 },
      { id: "e7", name: "Shop-floor lighting (HPMV/T8)", category: "lighting", ratedKw: 85, quantity: 1, hoursPerMonth: 620, loadFactor: 1 },
    ],
    interventions: [
      {
        id: "iv1",
        title: "Compressed air leak repair + header pressure 7.5 → 6.8 bar",
        opportunityId: "equip-compressor",
        implementedMonth: "2026-06",
        cost: 380000,
      },
    ],
    opportunityStatus: { "equip-compressor": "implemented", "contract-demand": "planned" },
  };
}
