-- Phase 12.6 audit correction: catalog objects are intentional views, not base tables.
-- Harden the underlying base-table invariant discovered during audit.
do $$
begin
  if exists (select 1 from public.factory_assets where factory_id is null) then
    raise exception 'Cannot harden factory_assets.factory_id: NULL rows exist';
  end if;
end $$;

alter table public.factory_assets
  alter column factory_id set not null;

-- Preserve view semantics while ensuring their underlying base identities remain canonical.
-- No PK is added to the views themselves because PostgreSQL views do not own row identity.
