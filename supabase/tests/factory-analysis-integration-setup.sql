-- Isolated local-only fixtures for HTTP integration tests. Never run against a shared or production database.
begin;

insert into auth.users
  (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at,
   raw_app_meta_data, raw_user_meta_data)
values
  ('a3333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated',
   'gridmind-http-a@example.test', crypt('gridmind-ci-password', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb),
  ('b4444444-4444-4444-8444-444444444444', 'authenticated', 'authenticated',
   'gridmind-http-b@example.test', crypt('gridmind-ci-password', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb);

insert into auth.identities
  (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values
  ('a3333333-3333-4333-8333-333333333333', 'a3333333-3333-4333-8333-333333333333',
   '{"sub":"a3333333-3333-4333-8333-333333333333","email":"gridmind-http-a@example.test","email_verified":true}'::jsonb,
   'email', now(), now(), now()),
  ('b4444444-4444-4444-8444-444444444444', 'b4444444-4444-4444-8444-444444444444',
   '{"sub":"b4444444-4444-4444-8444-444444444444","email":"gridmind-http-b@example.test","email_verified":true}'::jsonb,
   'email', now(), now(), now());

insert into public.organizations (name)
values ('gridmind-http-org-a'), ('gridmind-http-org-b');

insert into public.organization_members (organization_id, user_id, role, status)
select o.id, u.id, 'owner', 'active'
from public.organizations o
join auth.users u on (o.name = 'gridmind-http-org-a' and u.email = 'gridmind-http-a@example.test')
                or (o.name = 'gridmind-http-org-b' and u.email = 'gridmind-http-b@example.test');

insert into public.factories (organization_id, name)
select o.id, 'gridmind-http-factory-a'
from public.organizations o where o.name = 'gridmind-http-org-a';
insert into public.factories (organization_id, name)
select o.id, 'gridmind-http-factory-b'
from public.organizations o where o.name = 'gridmind-http-org-b';

insert into public.factory_assets (factory_id, name)
select f.id, a.asset_name
from public.factories f
cross join (values ('gridmind-http-asset-a'), ('gridmind-http-asset-a2')) as a(asset_name)
where f.name = 'gridmind-http-factory-a';
insert into public.factory_assets (factory_id, name)
select f.id, 'gridmind-http-asset-b'
from public.factories f where f.name = 'gridmind-http-factory-b';

insert into public.factory_members (factory_id, user_id, organization_id, role)
select f.id, u.id, o.id, 'owner'
from public.factories f
join public.organizations o on o.id = f.organization_id
join auth.users u on (o.name = 'gridmind-http-org-a' and u.email = 'gridmind-http-a@example.test')
                or (o.name = 'gridmind-http-org-b' and u.email = 'gridmind-http-b@example.test')
where (f.name = 'gridmind-http-factory-a' and o.name = 'gridmind-http-org-a')
   or (f.name = 'gridmind-http-factory-b' and o.name = 'gridmind-http-org-b');

commit;
