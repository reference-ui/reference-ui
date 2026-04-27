import { defineConfig } from '@playwright/test'

export default defineConfig({
  reporter: 'line',
  testDir: './e2e',
  use: {
    headless: true,
  },
})