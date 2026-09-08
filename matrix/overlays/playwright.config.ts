/*
 * This file is generated and managed by pipeline.
 */
import { defineConfig } from '@playwright/test'

export default defineConfig({
  reporter: 'line',
  testDir: './tests/e2e',
  timeout: 15_000,
  workers: 1,
  fullyParallel: false,
  use: {
    headless: true,
  },
  projects: [
    {
      name: 'vite7',
      use: {
        baseURL: 'http://127.0.0.1:4173',
      },
    }
  ],
  webServer: [
    {
      command: 'pnpm exec vite --host 127.0.0.1 --port 4173',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: true,
      timeout: 120_000,
    }
  ],
})
