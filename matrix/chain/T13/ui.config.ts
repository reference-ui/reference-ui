import { defineConfig } from '@reference-ui/core'
import { baseSystem as chain1 } from '@fixtures/meta-extend-library'
import { baseSystem as chain2 } from '@fixtures/meta-extend-library-2'
import { baseSystem as layerW } from '@fixtures/layer-library'

/**
 * T13 — Parallel chains + shared layer.
 *
 * Topology:
 *   extend-library    ──▶ extend ──▶ meta-extend-library    ──▶ extend ──┐
 *   extend-library-2  ──▶ extend ──▶ meta-extend-library-2  ──▶ extend ──┼──▶ User space
 *   layer-library     ──▶ layer  ───────────────────────────────────────────┘
 *
 * The hardest composition story: two transitive extend chains plus an
 * app-level layered library coexist in one build.
 */
export default defineConfig({
  name: 'chain-t13',
  include: ['src/**/*.{ts,tsx}'],
  extends: [chain1, chain2],
  layers: [layerW],
  debug: false,
})
