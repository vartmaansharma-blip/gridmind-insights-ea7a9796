-- GridMind Phase 12.5e: final exact-order FK index.
CREATE INDEX IF NOT EXISTS processes_parent_factory_fk_idx ON public.processes(parent_process_id,factory_id);
