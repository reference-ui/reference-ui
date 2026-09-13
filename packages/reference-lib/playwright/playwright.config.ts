import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'
import { resolveMajor } from './runtimes'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const port = process.env.CT_PORT ? parseInt(process.env.CT_PORT, 10) : 3101
const origin = `http://localhost:${port}`
const hostURL = `${origin}/playwright/index.html`
const major = resolveMajor()
const workersPerSlot = Math.max(1, Math.floor(os.cpus().length / 3))
const workers = process.env.CT_WORKERS ? parseInt(process.env.CT_WORKERS, 10) || workersPerSlot : workersPerSlot

export default defineConfig({
  testDir: '../src/components',
  testMatch: '**/__e2e__/**/*.ct.spec.ts',
  timeout: 30 * 1000,
  fullyParallel: true,
  workers,
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      maxDiffPixelRatio: 0.02,
    },
  },
  snapshotPathTemplate: '{testDir}/{testFileDir}/__snapshots__/{arg}{ext}',
  reporter: [
    ['html', { outputFolder: './playwright-report', open: 'never' }],
    ['json', { outputFile: process.env.PLAYWRIGHT_JSON_OUTPUT_NAME || './test-results/results.json' }],
    ['list'],
    [path.join(__dirname, 'snapshot-telemetry-reporter.ts')],
  ],
  outputDir: path.resolve(__dirname, 'test-results'),
  // Mouse and scroll resets happen in the fixture (ct.ts), since the config cannot access the page object directly.
  use: {
    trace: 'on-first-retry',
    video: {
      mode: 'on',
      size: { width: 800, height: 480 },
    },
    screenshot: 'on',
    viewport: { width: 800, height: 480 },
    colorScheme: 'dark',
  },
  projects: [
    {
      name: `react${major}`,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 800, height: 480 },
        baseURL: origin,
        serviceWorkers: 'block',
      },
    },
  ],
  webServer: {
    command: 'pnpm exec vite --config playwright/vite.config.ts',
    cwd: '..',
    url: hostURL,
    reuseExistingServer: true,
    timeout: 120 * 1000,
    env: {
      ...process.env,
      CT_REACT: major,
      CT_PORT: String(port),
    },
  },
})
