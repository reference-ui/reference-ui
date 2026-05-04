import { defineConfig } from '@playwright/test'

export default defineConfig({
  reporter: 'line',
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  webServer: {
    command: 'vite --port 5173',
    url: 'http://localhost:5173',
    reuseExistingServer: false,
  },
})