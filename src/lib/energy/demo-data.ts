import type { Factory, MonthRecord } from "./types";

// Fictional demo factory. NOT a real customer. Numbers are synthetic but
// generated deterministically so every visitor sees the same results.
// Synthetic tariffs and unit rates are deliberately fictional, not derived
// from an approved JSERC order or a customer electricity invoice.
export const DEMO_FACTORY_ID = "demo-adityapur";

const months = [
  "2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03",
  "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09",
];
// Synthetic output volume is intentionally reconciled against monthly meter totals,
// source power factor and recorded maximum demand. No real production is implied.
const production = [128700, 132600, 137150, 123500, 134550, 139750, 130650, 127400, 136500, 141700, 144300, 139100];
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
    // Fictional cost example only: this is NOT a JBVNL bill, approved tariff,
    // utility billing-demand calculation, or a basis for recoverable savings.
    // Do not impose a made-up universal contractual demand floor.
    const billed = peak[i];
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
    organizationId: null,
    name: "Adityapur Precision Auto Components",
    location: "Adityapur Industrial Area, Jharkhand",
    sector: "Auto components — machining, forging & heat treatment",
    productUnit: "component",
    contractDemandKva: CONTRACT,
    demandChargePerKva: DEMAND_RATE,
    isDemo: true,
    months: rows,
    equipment: [
      { id: "e1", name: "Screw air compressors", category: "compressor", ratedKw: 75, quantity: 4, hoursPerMonth: 600, loadFactor: 0.49 },
      { id: "e2", name: "Induction hardening furnaces", category: "furnace", ratedKw: 250, quantity: 2, hoursPerMonth: 550, loadFactor: 0.39 },
      { id: "e3", name: "CNC machining line motors", category: "motor", ratedKw: 15, quantity: 40, hoursPerMonth: 600, loadFactor: 0.36 },
      { id: "e4", name: "Press shop drives", category: "motor", ratedKw: 37, quantity: 12, hoursPerMonth: 560, loadFactor: 0.33 },
      { id: "e5", name: "Cooling tower pumps & fans", category: "motor", ratedKw: 30, quantity: 6, hoursPerMonth: 650, loadFactor: 0.46 },
      { id: "e6", name: "Paint booth HVAC", category: "hvac", ratedKw: 180, quantity: 1, hoursPerMonth: 500, loadFactor: 0.42 },
      { id: "e7", name: "Shop-floor lighting (HPMV/T8)", category: "lighting", ratedKw: 85, quantity: 1, hoursPerMonth: 620, loadFactor: 0.65 },
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
