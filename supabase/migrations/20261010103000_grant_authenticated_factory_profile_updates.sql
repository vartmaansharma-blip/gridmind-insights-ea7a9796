-- Allow authenticated users to update factory profile fields.
-- Row-level security policies remain responsible for restricting which factories
-- each user may update.
grant update on public.factories to authenticated;
