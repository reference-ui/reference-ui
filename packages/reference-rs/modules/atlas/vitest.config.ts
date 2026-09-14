/**
 * Vitest configuration for the atlas module test suite.
 * Configures test inclusion for JSX usage analysis, component indexing, and diagnostic assertions.
 * Registers the global workspace fixture setup script for consistent test execution.
 */
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const setupPath = fileURLToPath(new URL('./tests/globalSetup.ts', import.meta.url))

export default defineConfig({
  test: {
    name: 'atlas',
    include: [
      'tests/**/*.test.ts',
      'js/**/*.test.ts',
    ],
    globalSetup: [setupPath],
  },
})
