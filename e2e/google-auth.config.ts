import { defineConfig } from "@playwright/test";

// Synthetic HTTP fixtures and the real browser Supabase SDK. No Google account,
// shared Supabase project, credentials, database or customer data is used.
export default defineConfig({
  testDir: ".",
  testMatch: "google-auth.pw.ts",
  workers: 1,
  retries: 0,
  timeout: 30_000,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4186",
    browserName: "chromium",
    trace: "off",
    screenshot: "off",
  },
  webServer: {
    command: "bun run dev --host 127.0.0.1 --port 4186",
    cwd: "..",
    url: "http://127.0.0.1:4186/auth",
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      VITE_SUPABASE_URL: "http://127.0.0.1:54329",
      VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_synthetic_google_auth",
    },
  },
});
