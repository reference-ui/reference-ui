import { defineConfig, devices } from '@playwright/test'
import { MATRIX, getPort } from './src/matrix.js'

// Playwright doesn't support per-project webServer. We run each project separately
// via run-matrix.ts, which sets REF_TEST_PROJECT and REF_TEST_PORT.
const projectName = process.env.REF_TEST_PROJECT
const port = process.env.REF_TEST_PORT ? parseInt(process.env.REF_TEST_PORT, 10) : 5174
const blobOutput = process.env.PLAYWRIGHT_BLOB_OUTPUT

export default defineConfig({
  testDir: './src/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.REF_TEST_WORKERS
    ? parseInt(process.env.REF_TEST_WORKERS, 10)
    : 1,
  reporter: blobOutput
    ? [['blob', { outputFile: blobOutput }]]
    : 'html',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'on-first-retry',
  },
  projects: MATRIX.map((entry) => ({
    name: entry.name,
    use: { ...devices['Desktop Chrome'] },
  })),
  webServer: projectName
    ? {
        command: 'pnpm run dev',
        cwd: `.sandbox/${projectName}`,
        url: `http://localhost:${port}`,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      }
    : undefined,
})
