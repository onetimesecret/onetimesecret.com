import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E tests.
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:4321',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  // CI installs Chromium only and runs `--project=chromium --project="Mobile
  // Chrome"` (the e2e job in .github/workflows/ci.yml); the others are here for
  // local cross-browser checks and need `pnpm exec playwright install` first. A
  // bare `pnpm test:e2e` tries all of them, so match CI with the two explicit
  // --project flags, as docs/deployment.md and test/README.md prescribe.
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'pnpm preview',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    // Astro 7 detaches `astro preview` into a background process when it detects
    // an AI-agent environment (`am-i-vibing`), which makes Playwright see the
    // command exit immediately and give up ("webServer exited early").
    //
    // The variable name reads backwards here. It is the marker Astro sets on the
    // child it spawns — `env: { ...process.env, [config.envVar]: "1" }` in
    // node_modules/astro/dist/cli/server.js — and its presence is what stops the
    // CLI detecting an agent a second time:
    //
    //   agentDetected = !process.env.ASTRO_PREVIEW_BACKGROUND && isRunByAgent()
    //   wantsBackground = !!flags.background || agentDetected
    //
    // (node_modules/astro/dist/cli/preview/index.js). Only the `--background` flag
    // asks for a detached server, so setting this means "already the server, do
    // not re-spawn" and preview stays in the foreground under Playwright's
    // control. Where nothing is detected (CI, a normal shell) behaviour is
    // identical with or without it.
    //
    // If a future Astro release renames or drops the flag, the symptom is
    // "webServer exited early" again when the suite runs under an agent.
    env: { ASTRO_PREVIEW_BACKGROUND: '1' },
  },
});
