import { defineConfig } from '@reference-ui/core'
import { baseSystem } from '@fixtures/extend-library'

/**
 * T1 — Extend one library.
 *
 * Topology: Library A ──▶ extend ──▶ User space
 *
 * Contract: upstream fragment + tokens + portable CSS are adopted into this
 * package's Panda config and TypeScript surface.
 */
export default defineConfig({
  name: 'chain-t1',
  include: ['src/**/*.{ts,tsx}'],
  extends: [baseSystem],
  debug: false,
})
