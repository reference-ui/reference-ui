/**
 * Vitest configuration for the system module test suite.
 * Targets system compiler specifications, expression lowering, cascade rules, and fixture suites.
 * Exposes isolated execution under the system project identifier without leaking into other modules.
 */
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'system',
    include: [
      'tests/**/*.test.ts',
      'js/**/*.test.ts',
    ],
  },
})
