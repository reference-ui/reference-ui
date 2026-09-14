/**
 * Vitest configuration for the atomic module test suite.
 * Targets atomic compiler specifications, expression lowering, cascade rules, and fixture suites.
 * Exposes isolated execution under the atomic project identifier without leaking into other modules.
 */
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'atomic',
    include: [
      'tests/**/*.test.ts',
      'js/**/*.test.ts',
    ],
  },
})
