import { defineConfig } from "@playwright/test";
import { localBackend, localIntakeOrganization } from "./local-backend";

// These tests must never contact a shared/production Supabase project.
const backend = new URL(process.env.SUPABASE_URL ?? "http://127.0.0.1:54321");
if (backend.origin !== "http://127.0.0.1:54321") {
  throw new Error("Browser acceptance requires the isolated local Supabase stack.");
}
if (!process.env.SUPABASE_ANON_KEY) throw new Error("Local SUPABASE_ANON_KEY is required.");
// Server-only credential comes directly from the disposable CLI stack, never
// from a shared project or VITE_* variable. The browser receives only anon.
const isolated = localBackend();
const intakeOrganization = await localIntakeOrganization();

export default defineConfig({
  testDir: ".",
  testMatch: [
    "authenticated-flow.pw.ts",
    "connected-authenticated.pw.ts",
    "portal-authenticated.pw.ts",
    "electricity-authenticated.pw.ts",
    "industrial-core-authenticated.pw.ts",
    "profile-authenticated.pw.ts",
  ],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  maxFailures: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    browserName: "chromium",
    viewport: { width: 1440, height: 1000 },
    // Do not retain browser sessions or network traces containing local JWTs.
    trace: "off",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "bun run dev --host 127.0.0.1 --port 4173",
    cwd: "..",
    url: "http://127.0.0.1:4173/auth",
    reuseExistingServer: false,
    timeout: 90_000,
    env: {
      VITE_SUPABASE_URL: backend.origin,
      VITE_SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_ANON_KEY,
      SUPABASE_URL: isolated.origin,
      SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_ANON_KEY,
      GRIDMIND_CONNECTED_CASES_ENABLED: "synthetic-only",
      GRIDMIND_ELECTRICITY_ENABLED: "synthetic-only",
      GRIDMIND_CORE_ENABLED: "synthetic-only",
      GRIDMIND_CASES_SERVICE_ROLE_KEY: isolated.serviceKey,
      GRIDMIND_INTAKE_ORGANIZATION_ID: intakeOrganization,
    },
  },
});
