-- Avoid recursive RLS evaluation when an organization admin reads or manages memberships.
-- The prior policies queried public.organization_members from policies on that same table,
-- which can recurse through RLS. A narrowly scoped SECURITY DEFINER predicate evaluates
-- only the caller's active owner/admin membership; it accepts no caller-supplied user ID.

create or replace function private.is_org_admin(_organization_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = _organization_id
      and om.user_id = (select auth.uid())
      and om.status = 'active'
      and om.role in ('owner', 'admin')
  );
$function$;

revoke all on function private.is_org_admin(bigint) from public, anon;
grant execute on function private.is_org_admin(bigint) to authenticated;

drop policy if exists "members read organization_members" on public.organization_members;
create policy "members read organization_members"
on public.organization_members
for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select private.is_org_admin(organization_id))
);

drop policy if exists "admins insert organization_members" on public.organization_members;
create policy "admins insert organization_members"
on public.organization_members
for insert
to authenticated
with check ((select private.is_org_admin(organization_id)));

drop policy if exists "admins update organization_members" on public.organization_members;
create policy "admins update organization_members"
on public.organization_members
for update
to authenticated
using ((select private.is_org_admin(organization_id)))
with check ((select private.is_org_admin(organization_id)));

-- These structural privileges are not needed by the application roles and are not
-- constrained by row-level security. Remove any legacy/PUBLIC grants explicitly.
revoke truncate, references, trigger
on table public.organization_members
from public, anon, authenticated, service_role;
