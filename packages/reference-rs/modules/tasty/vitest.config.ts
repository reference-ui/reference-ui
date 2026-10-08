/**
 * Vitest configuration for the tasty module test suite.
 * Configures test inclusion for type scanning, declaration generation, and projection cases.
 * Executes declarative station test suites and internal unit specs without global pre-runners.
 */
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'tasty',
    include: [
      'tests/**/*.test.ts',
      'js/**/*.test.ts',
    ],
  },
})
