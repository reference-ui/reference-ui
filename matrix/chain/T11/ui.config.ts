import { defineConfig } from '@reference-ui/core'
import { baseSystem as extendA } from '@fixtures/extend-library'
import { baseSystem as extendB } from '@fixtures/extend-library-2'
import { baseSystem as layerC } from '@fixtures/layer-library'
import { baseSystem as layerD } from '@fixtures/layer-library-2'

/**
 * T11 — Full mix. Several extends + several layers.
 *
 * Topology:
 *   extend-library    ──▶ extend ──┐
 *   extend-library-2  ──▶ extend ──┤
 *   layer-library     ──▶ layer  ──┼──▶ User space
 *   layer-library-2   ──▶ layer  ──┘
 *
 * Final assembly order is fixed by the compiler:
 *   extends... (declared order), then layers... (declared order), then local.
 */
export default defineConfig({
  name: 'chain-t11',
  include: ['src/**/*.{ts,tsx}'],
  extends: [extendA, extendB],
  layers: [layerC, layerD],
  debug: false,
})
