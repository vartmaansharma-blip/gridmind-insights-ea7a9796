import { defineConfig } from "@playwright/test";

// This suite is deliberately independent of auth/customer-data acceptance.
// It must run without database credentials and reject backend requests.
export default defineConfig({
  testDir: ".",
  testMatch: [
    "synthetic-investigation.pw.ts",
    "product.pw.ts",
    "industrial-core.pw.ts",
    "customer-demo.pw.ts",
  ],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  maxFailures: 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4185",
    browserName: "chromium",
    viewport: { width: 1365, height: 900 },
    trace: "off",
    screenshot: "only-on-failure",
  },
  webServer: {
    // Match the locked Wrangler/workerd runtime in this isolated test server only.
    // Nitro may generate a newer date from the build clock; production config is unchanged.
    command:
      "bun run preview -- --ip 127.0.0.1 --port 4185 --compatibility-date 2026-10-19 --show-interactive-dev-session=false",
    cwd: "..",
    url: "http://127.0.0.1:4185/investigations",
    reuseExistingServer: false,
    timeout: 60_000,
    env: { WRANGLER_SEND_METRICS: "false" },
  },
});
