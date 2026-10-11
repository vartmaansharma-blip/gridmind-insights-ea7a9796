-- Cover analysis-run foreign keys while preserving tenant-aware query patterns.
-- asset_id leads the composite index so both asset_id and (asset_id, factory_id) FKs are covered.
CREATE INDEX IF NOT EXISTS factory_analysis_runs_asset_factory_fk_idx
  ON public.factory_analysis_runs (asset_id, factory_id);

CREATE INDEX IF NOT EXISTS factory_analysis_runs_created_by_idx
  ON public.factory_analysis_runs (created_by);
