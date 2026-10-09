
do $$
begin
  if not exists (select 1 from pg_constraint where conname='asset_interventions_asset_factory_fkey') then
    alter table public.asset_interventions
      add constraint asset_interventions_asset_factory_fkey
      foreign key (asset_id, factory_id)
      references public.factory_assets(id, factory_id)
      on delete restrict;
  end if;
end $$;

alter table public.evidence_links enable row level security;

drop policy if exists "factory members read evidence_links" on public.evidence_links;
create policy "factory members read evidence_links" on public.evidence_links
for select to authenticated using ((select private.is_factory_member_v2(factory_id)));

drop policy if exists "factory members insert evidence_links" on public.evidence_links;
create policy "factory members insert evidence_links" on public.evidence_links
for insert to authenticated with check ((select private.is_factory_member_v2(factory_id)));

drop policy if exists "factory members update evidence_links" on public.evidence_links;
create policy "factory members update evidence_links" on public.evidence_links
for update to authenticated
using ((select private.is_factory_member_v2(factory_id)))
with check ((select private.is_factory_member_v2(factory_id)));

drop policy if exists "canonical factory members read asset_interventions" on public.asset_interventions;
drop policy if exists "canonical factory members insert asset_interventions" on public.asset_interventions;
drop policy if exists "canonical factory members update asset_interventions" on public.asset_interventions;

alter table public.factory_members drop constraint if exists factory_members_factory_user_unique;
alter table public.organization_members drop constraint if exists organization_members_org_user_unique;
