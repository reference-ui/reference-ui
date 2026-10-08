/**
 * Vitest configuration for the styletrace module test suite.
 * Configures test execution for wrapper graph resolution, style property extraction, and JSX inspection.
 * Isolates styletrace tests under a dedicated Vitest project identifier.
 */
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'styletrace',
    include: [
      'tests/**/*.test.ts',
      'js/**/*.test.ts',
    ],
  },
})
