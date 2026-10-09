create index if not exists asset_interventions_event_idx on public.asset_interventions(event_id);
create index if not exists factory_assets_machine_type_idx on public.factory_assets(machine_type_id);
create index if not exists savings_verifications_intervention_idx on public.savings_verifications(intervention_id);