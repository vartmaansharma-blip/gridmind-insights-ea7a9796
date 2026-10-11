-- Explicitly scope the organization-membership UPDATE policy to authenticated.
-- The previous hardening migration omitted TO authenticated on this policy, so PostgreSQL
-- defaulted its target role to PUBLIC. The predicate still requires an active owner/admin,
-- and anon has no UPDATE table privilege, but the policy should be role-scoped explicitly.

drop policy if exists "admins update organization_members" on public.organization_members;
create policy "admins update organization_members"
on public.organization_members
for update
to authenticated
using ((select private.is_org_admin(organization_id)))
with check ((select private.is_org_admin(organization_id)));
