/**
 * Root Vitest workspace configuration for the reference-rs package.
 * Discovers modular per-module vitest configurations across modules/*, plus the
 * contracts and the testing library's own unit tests.
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
    ],
  },
})
