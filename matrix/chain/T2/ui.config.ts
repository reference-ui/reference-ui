import { defineConfig } from '@reference-ui/core'
import { baseSystem } from '@fixtures/layer-library'

/**
 * T2 — Layer one library.
 *
 * Topology: Library A ──▶ layer ──▶ User space
 *
 * Contract: upstream portable CSS is assembled into the final stylesheet, but
 * the upstream fragment is NOT adopted. Layer-library tokens do not enter this
 * package's Panda config or TypeScript surface.
 */
export default defineConfig({
  name: 'chain-t2',
  include: ['src/**/*.{ts,tsx}'],
  layers: [baseSystem],
  debug: false,
})
