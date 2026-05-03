import { defineConfig } from '@reference-ui/core'
import { baseSystem as chain1 } from '@fixtures/meta-extend-library'
import { baseSystem as chain2 } from '@fixtures/meta-extend-library-2'

/**
 * T16 — Parallel chains.
 *
 * Topology:
 *   extend-library    ──▶ extend ──▶ meta-extend-library    ──▶ extend ──┐
 *                                                                         ├──▶ User space
 *   extend-library-2  ──▶ extend ──▶ meta-extend-library-2  ──▶ extend ──┘
 *
 * Two independent transitive paths land at the same boundary. The app sees
 * tokens from BOTH chain endpoints AND both shared bases.
 */
export default defineConfig({
  name: 'chain-t16',
  include: ['src/**/*.{ts,tsx}'],
  extends: [chain1, chain2],
  debug: false,
})
