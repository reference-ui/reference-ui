/**
 * Root Vitest workspace configuration for the reference-rs package.
 * Discovers modular per-module vitest configurations across modules/*, plus the
 * contracts and the testing library's own unit tests.
 * Guarantees hermetic test boundaries without cross-suite leakage.
 */
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    testTimeout: 10000,
    projects: [
      'modules/*/vitest.config.ts',
      'contracts/vitest.config.ts',
      'testing/vitest.config.ts',
    ],
  },
})
