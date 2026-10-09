/**
 * Browser-facing export of the shared deterministic engine.
 * The same source is imported by the Supabase Edge Function so persistence
 * never relies on a separately maintained calculation implementation.
 */
export * from "../../../supabase/functions/_shared/analysis-loop";
