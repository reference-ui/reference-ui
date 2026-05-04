import { defineConfig } from '@playwright/test'

export default defineConfig({
  reporter: 'line',
  testDir: './tests/e2e',
  timeout: 180_000,
  workers: 1,
  fullyParallel: false,
  use: {
    headless: true,
    baseURL: 'http://127.0.0.1:4196',
  },
  projects: [
    {
      name: 'vite7',
    },
  ],
  webServer: [
    {
      command: 'pnpm exec vite --host 127.0.0.1 --port 4196',
      url: 'http://127.0.0.1:4196',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
})