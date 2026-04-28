import { defineConfig } from '@playwright/test'

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
        baseURL: 'http://127.0.0.1:4173',
      },
    },
    {
      name: 'webpack5',
      use: {
        baseURL: 'http://127.0.0.1:4174',
      },
    },
  ],
  webServer: [
    {
      command: 'pnpm exec vite --host 127.0.0.1 --port 4173',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: 'pnpm exec webpack serve --config webpack.config.cjs --host 127.0.0.1 --port 4174',
      url: 'http://127.0.0.1:4174',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
})