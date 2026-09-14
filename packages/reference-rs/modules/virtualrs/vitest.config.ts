/**
 * Vitest configuration for the virtualrs module test suite.
 * Configures test cases for AST transformation, import rewriting, and responsive lowering passes.
 * Registers global fixture test generation setup before executing case assertions.
 */
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const setupPath = fileURLToPath(new URL('./tests/globalSetup.ts', import.meta.url))

export default defineConfig({
  test: {
    name: 'virtualrs',
    include: [
      'tests/**/*.test.ts',
      'js/**/*.test.ts',
    ],
    globalSetup: [setupPath],
  },
})
