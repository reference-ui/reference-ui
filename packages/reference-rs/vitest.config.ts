/**
 * Root Vitest workspace configuration for the reference-rs package.
 * Discovers modular per-module vitest configurations across modules/*, plus the
 * contracts, the testing library's own unit tests, and the corpus termination suite (an inline project named corpus,
 * whose tests run every walker over real declaration and component trees in child processes).
 * Guarantees hermetic test boundaries without cross-suite leakage. The root globalSetup computes the dist freshness
 * verdict once per run; a project-level globalSetup would run once per project instead.
 */
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    testTimeout: 10000,
    globalSetup: ['testing/global-setup.ts'],
    projects: [
      'modules/*/vitest.config.ts',
      'contracts/vitest.config.ts',
      'testing/vitest.config.ts',
      {
        test: {
          name: 'corpus',
          include: ['testing/corpus/*.test.ts'],
          testTimeout: 120000,
        },
      },
    ],
  },
})
