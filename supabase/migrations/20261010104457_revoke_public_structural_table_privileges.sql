-- Remove structural table privileges that are unnecessary for API roles.
-- TRUNCATE bypasses row-level security, so tenant RLS cannot compensate for this grant.
-- Ordinary SELECT/INSERT/UPDATE/DELETE privileges are intentionally unchanged.

do $migration$
declare
  target record;
begin
  for target in
    select n.nspname, c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
  loop
    execute format(
      'revoke truncate, references, trigger on table %I.%I from public, anon, authenticated, service_role',
      target.nspname,
      target.relname
    );
  end loop;
end
$migration$;
