import { defineConfig } from '@reference-ui/core'
import { baseSystem as branchB } from '@fixtures/meta-extend-library'
import { baseSystem as branchC } from '@fixtures/meta-extend-library-sibling'

/**
 * T17 — Diamond base, mixed branch composition.
 *
 * Topology:
 *   extend-library ──▶ extend ──▶ meta-extend-library         ──▶ layer  ──┐
 *                  └─▶ extend ──▶ meta-extend-library-sibling ──▶ extend ──┴─▶ User space
 *
 * Sibling branches built on the same base are adopted in different modes at
 * the app boundary:
 *   - branch B (meta-extend-library) is layered: only its CSS arrives;
 *     metaExtendBg does NOT enter the app's Panda token namespace.
 *   - branch C (meta-extend-library-sibling) is extended: its fragment
 *     contributes metaSiblingBg AND the shared base extend-library tokens.
 */
export default defineConfig({
  name: 'chain-t17',
  include: ['src/**/*.{ts,tsx}'],
  extends: [branchC],
  layers: [branchB],
  debug: false,
})
