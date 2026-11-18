import { defineConfig } from "@playwright/test";

const port = Number(process.env.E2E_PORT ?? 3100);

/**
 * Happy path in demo mode (no DATABASE_URL). Set PW_CHANNEL=msedge or chrome
 * to use an installed browser when Playwright's own download is blocked.
 */
export default defineConfig({
  testDir: "e2e",
  timeout: 120_000,
  use: {
    baseURL: `http://localhost:${port}`,
    channel: process.env.PW_CHANNEL || undefined,
    viewport: { width: 1440, height: 1000 },
  },
  webServer: {
    command: `pnpm exec next dev --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: true,
    timeout: 180_000,
    env: { DATABASE_URL: "", RELAY_DEMO_FIXTURES: "1" },
  },
});
