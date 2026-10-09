/**
 * Browser-facing re-export of the canonical evidence adapter.
 * The exact same mapping/validation code runs inside the Edge Function.
 */
export { buildAnalysisInputFromCanonical } from "../../../supabase/functions/_shared/analysis-input-adapter";
export type {
  AnalysisEconomicContext,
  AnalysisObservationRole,
} from "../../../supabase/functions/_shared/analysis-input-adapter";
