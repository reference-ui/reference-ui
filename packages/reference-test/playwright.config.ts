import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './src/tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm run dev',
    cwd: '.sandbox',
    url: 'http://localhost:5174',
    // Always start fresh: prepare nukes .sandbox, so a reused server would serve stale/empty content
    reuseExistingServer: false,
    timeout: 30_000,
  },
})
