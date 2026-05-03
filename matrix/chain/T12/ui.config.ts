import { defineConfig } from '@reference-ui/core'
import { baseSystem as metaExtend } from '@fixtures/meta-extend-library'
import { baseSystem as layerW } from '@fixtures/layer-library'

/**
 * T12 — Chain + layer at the app.
 *
 * Topology:
 *   extend-library ──▶ extend ──▶ meta-extend-library ──▶ extend ──┐
 *                                                                   ├──▶ User space
 *   layer-library  ──▶ layer  ────────────────────────────────────────┘
 *
 * Transitive extend chain coexists with an app-level layered library.
 * Layered tokens (e.g. layerPrivateAccent) must NOT leak into the app's
 * Panda token namespace.
 */
export default defineConfig({
  name: 'chain-t12',
  include: ['src/**/*.{ts,tsx}'],
  extends: [metaExtend],
  layers: [layerW],
  debug: false,
})
