import { defineConfig, devices } from '@playwright/test'
import { MATRIX, getPort } from './src/matrix/index.js'
import { loadConfig } from './src/config.js'

const cfg = loadConfig()
const projectName = cfg.defaultProject
const project = MATRIX.find((e) => e.name === projectName) ?? MATRIX[0]
const port = process.env.REF_TEST_PORT
  ? parseInt(process.env.REF_TEST_PORT, 10)
  : getPort(project)
const blobOutput = process.env.PLAYWRIGHT_BLOB_OUTPUT

export default defineConfig({
  testDir: './src/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: cfg.workers,
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
          command: 'tsx src/scripts/start-dev.ts',
          cwd: process.cwd(),
          url: `http://localhost:${port}`,
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
      }
    : undefined,
})
