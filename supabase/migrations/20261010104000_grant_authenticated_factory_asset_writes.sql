-- Allow factory owners/admins to create and edit asset records through the API.
-- Existing RLS policies continue to restrict writes to authorized factory members.
grant insert, update on public.factory_assets to authenticated;
