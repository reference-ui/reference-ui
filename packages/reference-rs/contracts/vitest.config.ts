/**
 * Vitest configuration for Reference RS cross-package contract fixtures.
 * Runs tests in contracts/tests/*.test.ts against committed JSON fixtures.
 */
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'contracts',
    include: ['tests/**/*.test.ts'],
    testTimeout: 10000,
  },
})
