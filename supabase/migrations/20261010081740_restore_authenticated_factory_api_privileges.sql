-- Restore authenticated API privileges for the factory workspace and data surfaces.
-- RLS remains the row-level authorization boundary; this migration does not add or weaken policies.
grant select on public.factories to authenticated;
grant select on public.factory_assets to authenticated;
grant select, insert, update on public.observations to authenticated;
grant select, insert, update on public.data_sources to authenticated;
grant select, insert, update on public.operating_contexts to authenticated;
grant select, insert, update on public.economic_contexts to authenticated;
grant select, insert, update on public.opportunities to authenticated;
grant select, insert, update on public.asset_interventions to authenticated;
grant select, insert, update on public.verified_outcomes to authenticated;
grant select on public.factory_members to authenticated;
grant select, insert, update on public.organization_members to authenticated;
grant select on public.machine_types to authenticated;
grant select on public.data_source_mappings to authenticated;
grant select on public.performance_deviations to authenticated;
grant select, insert, update on public.verification_plans to authenticated;
grant select, insert, update on public.verification_runs to authenticated;
