-- Revoke factory-level access when a user's organization membership is no longer active.
-- This keeps factory and asset RLS decisions consistent with organization membership state.

CREATE OR REPLACE FUNCTION private.can_access_asset(_asset_id bigint, _roles text[] DEFAULT NULL::text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.factory_assets a
    JOIN public.factory_members fm ON fm.factory_id = a.factory_id
    JOIN public.organization_members om
      ON om.organization_id = fm.organization_id
     AND om.user_id = fm.user_id
     AND om.status = 'active'
    WHERE a.id = _asset_id
      AND fm.user_id = (SELECT auth.uid())
      AND (_roles IS NULL OR fm.role = ANY(_roles))
  );
$function$;

CREATE OR REPLACE FUNCTION private.is_factory_member(_factory_id bigint, _roles text[] DEFAULT NULL::text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.factory_members fm
    JOIN public.organization_members om
      ON om.organization_id = fm.organization_id
     AND om.user_id = fm.user_id
     AND om.status = 'active'
    WHERE fm.factory_id = _factory_id
      AND fm.user_id = (SELECT auth.uid())
      AND (_roles IS NULL OR fm.role = ANY(_roles))
  );
$function$;

CREATE OR REPLACE FUNCTION private.is_factory_member_v2(_factory_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.factory_members fm
    JOIN public.organization_members om
      ON om.organization_id = fm.organization_id
     AND om.user_id = fm.user_id
     AND om.status = 'active'
    WHERE fm.factory_id = _factory_id
      AND fm.user_id = (SELECT auth.uid())
  );
$function$;
