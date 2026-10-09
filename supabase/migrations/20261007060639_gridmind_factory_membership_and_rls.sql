-- 1. Membership model
create table if not exists public.factory_members (
  id bigint generated always as identity primary key,
  factory_id bigint not null references public.factories(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('owner','admin','analyst','viewer')),
  created_at timestamptz not null default now(),
  unique (factory_id, user_id)
);
create index if not exists factory_members_user_idx on public.factory_members(user_id);
alter table public.factory_members enable row level security;

-- 2. Helper functions in a non-exposed schema
create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.is_factory_member(_factory_id bigint, _roles text[] default null)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.factory_members m
    where m.factory_id = _factory_id
      and m.user_id = (select auth.uid())
      and (_roles is null or m.role = any(_roles))
  );
$$;

create or replace function private.can_access_asset(_asset_id bigint, _roles text[] default null)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.factory_assets a
    join public.factory_members m on m.factory_id = a.factory_id
    where a.id = _asset_id
      and m.user_id = (select auth.uid())
      and (_roles is null or m.role = any(_roles))
  );
$$;

revoke all on function private.is_factory_member(bigint, text[]) from public, anon;
revoke all on function private.can_access_asset(bigint, text[]) from public, anon;
grant execute on function private.is_factory_member(bigint, text[]) to authenticated;
grant execute on function private.can_access_asset(bigint, text[]) to authenticated;

-- 3. Policies: membership (users see only their own rows; writes are service-role only)
drop policy if exists "members read own membership" on public.factory_members;
create policy "members read own membership" on public.factory_members
  for select to authenticated using (user_id = (select auth.uid()));

-- 4. Policies: factories
drop policy if exists "members read factory" on public.factories;
create policy "members read factory" on public.factories
  for select to authenticated using (private.is_factory_member(id));
drop policy if exists "admins update factory" on public.factories;
create policy "admins update factory" on public.factories
  for update to authenticated
  using (private.is_factory_member(id, array['owner','admin']))
  with check (private.is_factory_member(id, array['owner','admin']));

-- 5. Policies: factory_assets
drop policy if exists "members read assets" on public.factory_assets;
create policy "members read assets" on public.factory_assets
  for select to authenticated using (private.is_factory_member(factory_id));
drop policy if exists "admins insert assets" on public.factory_assets;
create policy "admins insert assets" on public.factory_assets
  for insert to authenticated with check (private.is_factory_member(factory_id, array['owner','admin']));
drop policy if exists "admins update assets" on public.factory_assets;
create policy "admins update assets" on public.factory_assets
  for update to authenticated
  using (private.is_factory_member(factory_id, array['owner','admin']))
  with check (private.is_factory_member(factory_id, array['owner','admin']));
drop policy if exists "admins delete assets" on public.factory_assets;
create policy "admins delete assets" on public.factory_assets
  for delete to authenticated using (private.is_factory_member(factory_id, array['owner','admin']));

-- 6. Policies: asset-scoped tables
do $$
declare t text;
begin
  -- configuration tables: members read, owner/admin write
  foreach t in array array['asset_calibration_profiles','asset_integration_profiles','asset_sensor_mappings','retrofit_assessments']
  loop
    execute format('drop policy if exists "members read %1$s" on public.%1$I', t);
    execute format('create policy "members read %1$s" on public.%1$I for select to authenticated using (private.can_access_asset(asset_id))', t);
    execute format('drop policy if exists "admins insert %1$s" on public.%1$I', t);
    execute format('create policy "admins insert %1$s" on public.%1$I for insert to authenticated with check (private.can_access_asset(asset_id, array[''owner'',''admin'']))', t);
    execute format('drop policy if exists "admins update %1$s" on public.%1$I', t);
    execute format('create policy "admins update %1$s" on public.%1$I for update to authenticated using (private.can_access_asset(asset_id, array[''owner'',''admin''])) with check (private.can_access_asset(asset_id, array[''owner'',''admin'']))', t);
    execute format('drop policy if exists "admins delete %1$s" on public.%1$I', t);
    execute format('create policy "admins delete %1$s" on public.%1$I for delete to authenticated using (private.can_access_asset(asset_id, array[''owner'',''admin'']))', t);
  end loop;

  -- operational tables: members read, owner/admin/analyst insert+update, no delete
  foreach t in array array['asset_measurements','intelligence_events','asset_interventions','savings_verifications']
  loop
    execute format('drop policy if exists "members read %1$s" on public.%1$I', t);
    execute format('create policy "members read %1$s" on public.%1$I for select to authenticated using (private.can_access_asset(asset_id))', t);
    execute format('drop policy if exists "analysts insert %1$s" on public.%1$I', t);
    execute format('create policy "analysts insert %1$s" on public.%1$I for insert to authenticated with check (private.can_access_asset(asset_id, array[''owner'',''admin'',''analyst'']))', t);
    execute format('drop policy if exists "analysts update %1$s" on public.%1$I', t);
    execute format('create policy "analysts update %1$s" on public.%1$I for update to authenticated using (private.can_access_asset(asset_id, array[''owner'',''admin'',''analyst''])) with check (private.can_access_asset(asset_id, array[''owner'',''admin'',''analyst'']))', t);
  end loop;
end $$;

-- 7. Indexes for policy lookups and time-series reads
create index if not exists factory_assets_factory_idx on public.factory_assets(factory_id);
create index if not exists asset_measurements_asset_time_idx on public.asset_measurements(asset_id, measured_at desc);
create index if not exists intelligence_events_asset_idx on public.intelligence_events(asset_id, created_at desc);
create index if not exists asset_interventions_asset_idx on public.asset_interventions(asset_id);
create index if not exists savings_verifications_asset_idx on public.savings_verifications(asset_id);
create index if not exists asset_sensor_mappings_asset_idx on public.asset_sensor_mappings(asset_id);