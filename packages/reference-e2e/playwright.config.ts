import { defineConfig, devices } from '@playwright/test'
import { MATRIX, getPort } from './src/matrix/index'
import { loadConfig } from './src/config/index'

const cfg = loadConfig()
const projectName = cfg.defaultProject
const project = MATRIX.find((e) => e.name === projectName) ?? MATRIX[0]
const port = process.env.REF_TEST_PORT
  ? Number.parseInt(process.env.REF_TEST_PORT, 10)
  : getPort(project)
const blobOutput = process.env.PLAYWRIGHT_BLOB_OUTPUT

export default defineConfig({
  testDir: './src/tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Each project shares one sandbox and dev server, so cross-worker execution races on ui.config.ts
  // and generated .reference-ui output. Cross-project parallelism is handled by the matrix runner,
  // where each project gets its own sandbox and port.
  workers: 1,
  reporter: blobOutput
    ? [['blob', { outputFile: blobOutput }]]
    : 'html',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'on-first-retry',
    ...(process.env.REF_TEST_HEADED === '1' ? { headless: false } : {}),
  },
  projects: MATRIX.map((entry) => ({
    name: entry.name,
    use: { ...devices['Desktop Chrome'] },
  })),
  webServer: projectName
    ? {
          command: 'tsx src/runner/cli.ts dev',
          cwd: process.cwd(),
          url: `http://localhost:${port}`,
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
      }
    : undefined,
})
