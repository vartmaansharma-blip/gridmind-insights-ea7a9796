-- Reference/knowledge tables: readable by signed-in users only (no anon access).
-- Customer and operational tables stay locked (no policies) until a factory-membership model exists.
do $$
declare t text;
begin
  foreach t in array array['machine_types','machine_type_knowledge','machine_measurement_definitions','diagnostic_rules']
  loop
    execute format('drop policy if exists "authenticated can read %1$s" on public.%1$I', t);
    execute format('create policy "authenticated can read %1$s" on public.%1$I for select to authenticated using (true)', t);
  end loop;
end $$;