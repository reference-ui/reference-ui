/**
 * Vitest configuration for the diagnostics template test suite.
 * Verifies the shared wire representation, transport round-trips, and message helpers.
 * Isolates template tests so per-module suites never depend on shared-seam ordering.
 */
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'diagnostics',
    include: ['js/**/*.test.ts'],
  },
})
