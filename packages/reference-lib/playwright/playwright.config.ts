import { defineConfig, devices } from '@playwright/test'

const origin = 'http://localhost:3101'
const hostURL = `${origin}/playwright/index.html`

export default defineConfig({
  testDir: '../src/components',
  testMatch: '**/__e2e__/**/*.ct.spec.ts',
  timeout: 20 * 1000,
  fullyParallel: true,
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
    ['json', { outputFile: './test-results/results.json' }],
    ['list'],
  ],
  outputDir: './test-results',
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
      name: 'components',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 800, height: 480 },
        baseURL: origin,
        serviceWorkers: 'block',
      },
    },
  ],
  webServer: {
    command: 'pnpm run sync && pnpm exec vite --config playwright/vite.config.ts',
    cwd: '..',
    url: hostURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
