-- Isolated local-only fixtures for HTTP integration tests. Never run against a shared or production database.
begin;

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
