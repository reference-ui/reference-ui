/**
 * Unit-test config for this fixture package: node environment, `src` tests
 * only, green when a fixture ships no tests. The chain suites consume the
 * fixture's built output, not these tests; this file just keeps each fixture
 * runnable on its own.
 */

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    passWithNoTests: true,
  },
})
