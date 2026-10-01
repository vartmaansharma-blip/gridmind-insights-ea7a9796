// Core domain types. Data sources (manual entry, CSV, future meter integrations)
// all normalise into these shapes before analysis.

export type MonthRecord = {
  month: string; // YYYY-MM
  kwh: number;
  cost: number; // total bill, INR
  peakKva: number;
  production: number; // units produced
  operatingHours: number;
  powerFactor?: number;
};

export type EquipmentCategory = "compressor" | "motor" | "furnace" | "hvac" | "lighting" | "other";

export type Equipment = {
  id: string;
  name: string;
  category: EquipmentCategory;
  ratedKw: number;
  quantity: number;
  hoursPerMonth: number;
  loadFactor: number; // 0-1
};

export type Intervention = {
  id: string;
  title: string;
  opportunityId?: string;
  implementedMonth: string; // YYYY-MM
  cost: number;
};

export type OpportunityStatus = "open" | "planned" | "in_progress" | "implemented";

export type Factory = {
  id: string;
  name: string;
  location: string;
  sector: string;
  productUnit: string;
  contractDemandKva: number;
  demandChargePerKva: number;
  isDemo: boolean;
  months: MonthRecord[];
  equipment: Equipment[];
  interventions: Intervention[];
  opportunityStatus: Record<string, OpportunityStatus>;
  lastAnalyzedAt?: string;
};

export type Confidence = "high" | "medium" | "low";

export type Opportunity = {
  id: string;
  title: string;
  category: "demand" | "tariff" | "process" | "equipment";
  problem: string;
  cause: string;
  action: string;
  impactAnnual: number; // money currently being lost (est.)
  savingAnnual: number; // expected saving if action taken (est.)
  investment: number;
  paybackMonths: number | null;
  confidence: Confidence;
  calc: string[];
};

export type Alert = {
  id: string;
  severity: "critical" | "warning" | "info";
  month: string;
  title: string;
  detail: string;
  impactInr?: number;
};
