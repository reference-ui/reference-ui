// Unit-test config for @reference-ui/lib.
// It runs src and scripts tests in Node with globals on and at most two workers, passing
// quietly when no tests match.
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    maxWorkers: 2,
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.mjs'],
    passWithNoTests: true
  },
})
