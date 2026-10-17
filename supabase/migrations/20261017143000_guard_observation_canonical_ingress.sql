-- GridMind MVP: ordinary factory entries are observations, not verified evidence.
-- Non-destructive to existing rows. Browser users may create unverified source records,
-- but cannot self-attest data as valid or alter the audit trail after submission.
begin;

create function private.guard_canonical_observation_ingress()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if TG_OP <> 'INSERT' then
    raise exception 'CANONICAL_OBSERVATIONS_REQUIRE_APPEND_ONLY_CORRECTIONS' using errcode='42501';
  end if;
  -- Authentication does not imply technical validation or engineering review.
  if current_user in ('authenticated', 'anon') and NEW.quality_status = 'valid' then
    raise exception 'CANONICAL_VALIDATION_REQUIRES_QUALIFIED_REVIEW' using errcode='42501';
  end if;
  if NEW.quality_status = 'valid' and NEW.is_estimated then
    raise exception 'ESTIMATED_READING_CANNOT_BE_VALIDATED' using errcode='22023';
  end if;
  if NEW.data_source_id is not null and not exists(
    select 1 from public.data_sources s
    where s.id = NEW.data_source_id and s.factory_id = NEW.factory_id
  ) then
    raise exception 'DATA_SOURCE_FACTORY_MISMATCH' using errcode='42501';
  end if;
  if NEW.subject_type = 'factory'
    and (NEW.subject_id is null or NEW.subject_id <> NEW.factory_id) then
    raise exception 'FACTORY_OBSERVATION_SCOPE_MISMATCH' using errcode='42501';
  end if;
  if NEW.subject_type = 'asset'
    and (NEW.subject_id is null or not exists(
      select 1 from public.factory_assets a
      where a.id = NEW.subject_id and a.factory_id = NEW.factory_id
    )) then
    raise exception 'ASSET_OBSERVATION_SCOPE_MISMATCH' using errcode='42501';
  end if;
  return NEW;
end;
$$;

revoke all on function private.guard_canonical_observation_ingress() from public,anon,authenticated;
drop trigger if exists guard_canonical_observation_ingress on public.observations;
create trigger guard_canonical_observation_ingress
  before insert or update on public.observations
  for each row execute function private.guard_canonical_observation_ingress();

-- Factory users cannot silently rewrite original measurements. A future reviewed,
-- versioned correction endpoint must append superseding observations.
-- Replace inherited/legacy table grants with the exact customer-role contract:
-- a factory member may read and append unverified source records, never modify them.
revoke all on public.observations from public,anon,authenticated;
grant select,insert on public.observations to authenticated;

commit;
