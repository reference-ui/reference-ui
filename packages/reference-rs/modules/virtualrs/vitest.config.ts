/**
 * Vitest configuration for the virtualrs module test suite.
 * Configures test cases for AST transformation, import rewriting, and responsive lowering passes.
 * Discovers and executes station test suites and runtime unit specs across virtual transforms.
 */
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'virtualrs',
    include: [
      'tests/**/*.test.ts',
      'js/**/*.test.ts',
    ],
  },
})
