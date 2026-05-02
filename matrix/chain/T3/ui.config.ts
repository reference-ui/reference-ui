import { defineConfig } from '@reference-ui/core'
import { baseSystem as extendSystem } from '@fixtures/extend-library'
import { baseSystem as layerSystem } from '@fixtures/layer-library'

/**
 * T3 — Extend one library + layer another (hybrid).
 *
 * Topology:
 *   Library A ──▶ extend ──┐
 *                           ├──▶ User space
 *   Library B ──▶ layer  ──┘
 *
 * Contract:
 * - extend-library fragment + tokens ARE adopted into this package's config surface.
 * - layer-library fragment is NOT adopted; only its portable CSS enters the stylesheet.
 * - Final assembled stylesheet order: extend-library CSS, then layer-library CSS,
 *   then the local chain-t3 layer.
 */
export default defineConfig({
  name: 'chain-t3',
  include: ['src/**/*.{ts,tsx}'],
  extends: [extendSystem],
  layers: [layerSystem],
  debug: false,
})
