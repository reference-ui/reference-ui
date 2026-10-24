/**
 * Vitest configuration for the atlas module test suite.
 * Configures test inclusion for JSX usage analysis, component indexing, and diagnostic assertions.
 * Discovers cases and runs module-level integration tests.
 */
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'atlas',
    include: [
      'tests/**/*.test.ts',
      'js/**/*.test.ts',
    ],
    testTimeout: 30_000,
  },
})
