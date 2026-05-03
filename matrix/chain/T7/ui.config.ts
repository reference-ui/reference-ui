import { defineConfig } from '@reference-ui/core'
import { baseSystem as metaExtend } from '@fixtures/meta-extend-library'
import { baseSystem as metaExtendSibling } from '@fixtures/meta-extend-library-sibling'

/**
 * T7 — Diamond. App extends two libraries that both extend the same base.
 *
 * Topology:
 *   extend-library ──▶ extend ──▶ meta-extend-library          ──▶ extend ──┐
 *                  └─▶ extend ──▶ meta-extend-library-sibling ──▶ extend ──┴─▶ User space
 *
 * Both branches republish extend-library's fragment, which lands at the app
 * boundary twice. Per the current contract, no automatic deduplication is
 * guaranteed; we only assert that the composed app boots and that all token
 * adoptions resolve.
 */
export default defineConfig({
  name: 'chain-t7',
  include: ['src/**/*.{ts,tsx}'],
  extends: [metaExtend, metaExtendSibling],
  debug: false,
})
