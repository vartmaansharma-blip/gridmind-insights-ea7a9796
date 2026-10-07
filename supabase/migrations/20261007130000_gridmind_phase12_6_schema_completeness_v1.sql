-- GridMind Phase 12.6 — schema completeness audit correction
-- Applied to Supabase project bvqmvgbfqhgczwbvlqkk.
--
-- Findings:
-- 1. machine_type_catalog and machine_measurement_catalog are intentionally VIEWs,
--    not base tables. They therefore do not need (and cannot have) primary keys.
-- 2. Their row identity is inherited from machine_types.id and
--    machine_measurement_definitions.id respectively.
-- 3. factory_assets.factory_id had no NULL data and is now explicitly NOT NULL,
--    matching the canonical rule that every production asset belongs to a factory.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.factory_assets WHERE factory_id IS NULL) THEN
    RAISE EXCEPTION 'Cannot harden factory_assets.factory_id: NULL rows exist';
  END IF;
END $$;

ALTER TABLE public.factory_assets
  ALTER COLUMN factory_id SET NOT NULL;
