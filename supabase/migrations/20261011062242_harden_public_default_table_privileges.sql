-- Remove unnecessary structural and maintenance privileges from API roles.
-- TRUNCATE bypasses row-level security. Keep ordinary application DML privileges unchanged.
REVOKE MAINTAIN, TRUNCATE, REFERENCES, TRIGGER
ON ALL TABLES IN SCHEMA public
FROM PUBLIC, anon, authenticated, service_role;

-- Apply the same least-privilege defaults to future tables created by postgres.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
REVOKE MAINTAIN, TRUNCATE, REFERENCES, TRIGGER
ON TABLES
FROM PUBLIC, anon, authenticated, service_role;
