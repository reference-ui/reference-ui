import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'

// SD-ENV-04 cross-engine home. Runs the colocated env04.smoke.spec.ts on
// Chromium, Firefox, and WebKit against the ALREADY-RUNNING CT gallery
// (no webServer here: never boot a second Vite; run any `pnpm agentct`
// command first, or `pnpm agentct daemon`).
//
//   cd packages/reference-lib && pnpm exec playwright test --config src/components/Slider/__e2e__/env04.config.ts
//
// Requires the firefox/webkit browser builds in the Playwright cache
// (`pnpm exec playwright install firefox webkit`).

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  testDir: __dirname,
  testMatch: 'env04.smoke.spec.ts',
  timeout: 30 * 1000,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3101',
    viewport: { width: 800, height: 480 },
    serviceWorkers: 'block',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
})
