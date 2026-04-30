/*
 * This file is generated and managed by pipeline.
 */
import { defineConfig } from '@playwright/test'

const playwrightPort = Number.parseInt(process.env.REFERENCE_UI_PLAYWRIGHT_PORT ?? '4173', 10)
const baseURL = `http://127.0.0.1:${playwrightPort}`

export default defineConfig({
  reporter: 'line',
  testDir: './tests/e2e',
  timeout: 180_000,
  workers: 1,
  fullyParallel: false,
  use: {
    headless: true,
  },
  projects: [
    {
      name: 'vite7',
      use: {
        baseURL,
      },
    }
  ],
  webServer: [
    {
      command: `pnpm exec vite --host 127.0.0.1 --port ${playwrightPort}`,
      url: baseURL,
      reuseExistingServer: false,
      timeout: 120_000,
    }
  ],
})
