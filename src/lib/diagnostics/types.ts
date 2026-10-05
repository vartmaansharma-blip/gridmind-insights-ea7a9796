export type EvidenceState = "observed" | "estimated" | "hypothesis" | "recommended" | "verified";
export type DiagnosticStatus = "candidate" | "insufficient_evidence" | "evaluated" | "requires_investigation";

export interface DiagnosticSample {
  timestamp: string;
  values: Record<string, number | string | null>;
}

export interface DiagnosticRequest {
  assetId: string;
  machineTypeId: number;
  diagnosticKey: string;
  period: { start: string; end: string };
  samples: DiagnosticSample[];
  reference?: {
    values: Record<string, number>;
    source: "specification" | "engineering_model" | "historical" | "comparable_period" | "comparable_asset";
    version: string;
    confidence: number;
  };
  economics?: {
    electricityTariffPerKwh?: number;
    fuelPricePerLitre?: number;
    valuePerUnit?: number;
  };
  context?: Record<string, number | string | boolean>;
}

export interface EvidenceItem {
  key: string;
  state: EvidenceState;
  value?: number | string | boolean;
  source: string;
  confidence: number;
  lineage: string;
}

export interface DiagnosticResult {
  assetId: string;
  machineTypeId: number;
  diagnosticKey: string;
  status: DiagnosticStatus;
  evidence: EvidenceItem[];
  metrics: Record<string, number>;
  economicExposure?: {
    amount: number;
    currency: "INR";
    basis: string;
    uncertainty: "not_estimated" | "low" | "medium" | "high";
  };
  explanation: string;
  limitations: string[];
  nextInvestigation?: string[];
  evaluatedAt: string;
}
