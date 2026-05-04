import { defineConfig } from '@reference-ui/core'
import { baseSystem } from '@fixtures/extend-library'

/**
 * T8 — Same library extended and layered.
 *
 * Topology:
 *   extend-library ──▶ extend ──┐
 *                                ├──▶ User space
 *   extend-library ──▶ layer  ──┘
 *
 * Per `matrix/CHAIN_RULES.md`, the current policy is allow-and-document:
 * - the same package may appear in both buckets
 * - upstream CSS is not deduplicated
 * - extends-side fragment is adopted; layers-side adds the CSS again
 *
 * The contract test verifies the app boots and the upstream component still
 * resolves correctly.
 */
export default defineConfig({
  name: 'chain-t8',
  include: ['src/**/*.{ts,tsx}'],
  extends: [baseSystem],
  layers: [baseSystem],
  debug: false,
})
