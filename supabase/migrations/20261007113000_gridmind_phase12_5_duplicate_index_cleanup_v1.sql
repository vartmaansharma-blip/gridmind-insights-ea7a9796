-- GridMind Phase 12.5 cleanup: remove redundant duplicate membership index.
DROP INDEX IF EXISTS public.factory_members_factory_user_unique;
