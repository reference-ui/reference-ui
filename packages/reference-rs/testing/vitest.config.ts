/**
 * Vitest project for the reference-rs testing library itself.
 * Runs the unit tests that sit beside the case runner (the case.json convention and
 * other pure helpers), so pnpm agentrs v and t cover them without a module suite.
 */
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'testing',
    include: ['*.test.ts'],
  },
})
