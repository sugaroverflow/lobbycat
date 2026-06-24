import { defineConfig, devices } from "@playwright/test";

// Smoke tests run against either a Vercel preview URL (in CI, via
// PREVIEW_URL) or localhost (when developing locally). Keep this tiny:
// chromium only, single retry, 30s test timeout.
const baseURL = process.env.PREVIEW_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  retries: 1,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    ignoreHTTPSErrors: false,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
