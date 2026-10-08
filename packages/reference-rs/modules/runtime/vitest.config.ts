/**
 * Vitest configuration for the runtime host module test suite.
 * Verifies dynamic native addon loading, target resolution, and fallback error messaging.
 * Isolates runtime tests to avoid coupling with domain compiler suites.
 */
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'runtime',
    include: [
      'js/**/*.test.ts',
    ],
  },
})
