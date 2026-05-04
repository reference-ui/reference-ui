import { defineConfig } from '@reference-ui/core'
import { baseSystem } from '@fixtures/meta-extend-library'

/**
 * T6 — Chain. App extends only B; B already extends A.
 *
 * Topology: extend-library ──▶ extend ──▶ meta-extend-library ──▶ extend ──▶ User space
 *
 * Contract:
 *   meta-extend-library.baseSystem.fragment already republishes
 *   extend-library's contributions, so the app sees BOTH metaExtendBg
 *   (local) and fixtureDemoAccent (transitive) in its token namespace.
 */
export default defineConfig({
  name: 'chain-t6',
  include: ['src/**/*.{ts,tsx}'],
  extends: [baseSystem],
  debug: false,
})
