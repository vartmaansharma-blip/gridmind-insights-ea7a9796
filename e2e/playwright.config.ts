import { defineConfig } from "@playwright/test";

// These tests must never contact a shared/production Supabase project.
const backend = new URL(process.env.SUPABASE_URL ?? "http://127.0.0.1:54321");
if (backend.origin !== "http://127.0.0.1:54321") {
  throw new Error("Browser acceptance requires the isolated local Supabase stack.");
}
if (!process.env.SUPABASE_ANON_KEY) throw new Error("Local SUPABASE_ANON_KEY is required.");

export default defineConfig({
  testDir: ".",
  testMatch: "authenticated-flow.pw.ts",
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
    },
  },
});
