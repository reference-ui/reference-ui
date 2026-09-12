import { defineConfig, devices } from '@playwright/test'

const hostURL = 'http://localhost:3101/playwright/index.html'

export default defineConfig({
  testDir: '../src/components',
  testMatch: '**/*.ct.spec.ts',
  timeout: 10 * 1000,
  fullyParallel: true,
  reporter: [['html', { outputFolder: './playwright-report', open: 'never' }]],
  outputDir: './test-results',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'components',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: hostURL,
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
