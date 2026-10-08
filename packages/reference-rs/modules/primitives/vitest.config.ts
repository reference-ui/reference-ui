/**
 * Vitest project for the primitives generator golden suite plus the moved runtime.
 * Rebuilds E1/E2/E4 in memory and pins the committed bytes plus parity; runs the
 * factory/split/context suites beside their sources. Isolated from other
 * reference-rs suites; refresh means re-running
 * `pnpm --filter @reference-ui/rust run primitives`, never hand edits.
 */
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'primitives',
    include: ['tests/**/*.test.ts', 'js/**/*.test.ts'],
    testTimeout: 30000,
  },
})
