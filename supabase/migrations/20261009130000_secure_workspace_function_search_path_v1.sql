-- SECURITY DEFINER functions should not resolve application objects through a writable schema.
-- All application relations and auth.uid() are schema-qualified in this function.
ALTER FUNCTION public.create_factory_workspace(text, text, text)
  SET search_path = '';
