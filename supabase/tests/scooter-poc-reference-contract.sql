-- POC-01 migration acceptance. Reference-only, no customer vehicle data.
do $$
declare
  t text;
  n integer;
begin
  select count(*) into n from public.poc_asset_archetypes
   where archetype_id='gridmind-poc-01-generic-scooter'
     and manufacturer is null and model is null
     and validation_status='candidate_unvalidated'
     and measurement_execution_status='not_started'
     and physical_sensors_installed=0;
  if n <> 1 then raise exception 'POC reference missing or falsely marked configured'; end if;
  select count(*) into n from public.poc_asset_components
   where archetype_id='gridmind-poc-01-generic-scooter'
     and validation_status='archetype_candidate';
  if n <> 18 then raise exception 'Incorrect POC component count: %', n; end if;
  select count(*) into n from public.poc_measurement_candidates
   where archetype_id='gridmind-poc-01-generic-scooter'
     and validation_status='candidate_not_tested'
     and installation_status='not_installed';
  if n <> 12 then raise exception 'Incorrect POC measurement count: %', n; end if;
  select count(*) into n from public.poc_measurement_candidates
   where archetype_id='gridmind-poc-01-generic-scooter'
     and phase=0 and source_class='phone' and data_origin='independent_test_rig'
     and requires_qualified_professional=false;
  if n <> 2 then raise exception 'Independent software-only phone test incomplete'; end if;
  foreach t in array array['poc_asset_archetypes','poc_asset_components','poc_measurement_candidates']
  loop
    if not exists (select 1 from pg_class where oid=('public.' || t)::regclass and relrowsecurity) then
      raise exception 'RLS disabled on %', t;
    end if;
    if has_table_privilege('anon', 'public.' || t, 'SELECT')
      or has_table_privilege('authenticated', 'public.' || t, 'INSERT')
      or has_table_privilege('authenticated', 'public.' || t, 'UPDATE')
      or has_table_privilege('authenticated', 'public.' || t, 'DELETE')
      or not has_table_privilege('authenticated', 'public.' || t, 'SELECT')
    then raise exception 'POC table privilege leak on %', t; end if;
  end loop;
end $$;
