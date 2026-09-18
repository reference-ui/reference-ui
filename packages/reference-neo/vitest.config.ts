// Vitest configuration for the Neo host unit tests.
// It takes no input and emits a Node environment scoped to unit tests.
// Colocated src tests plus harness and bin unit tests run here; browser proof stays in cases.

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/shared/*.test.ts', 'bin/**/*.test.ts'],
    passWithNoTests: true,
  },
})
