/**
 * Root Vitest workspace configuration for the reference-rs package.
 * Discovers modular per-module vitest configurations across modules/*.
 * Guarantees hermetic test boundaries without cross-suite leakage.
 */
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    testTimeout: 10000,
    projects: ['modules/*/vitest.config.ts', 'contracts/vitest.config.ts'],
  },
})
