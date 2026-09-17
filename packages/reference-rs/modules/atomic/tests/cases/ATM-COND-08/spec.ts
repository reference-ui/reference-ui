/**
 * Host color-mode station. `_dark` / `_light` wrap with
 * `[data-color-mode=…]`, not `.dark` / `.light`. Single stamp:
 * no `data-panda-theme`, no `data-theme` for color mode.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-COND-08',
  verify(result) {
    expect(hasWant(result, 'bg', 'gray.900', ['_dark'])).toBe(true)
    expect(hasWant(result, 'color', 'gray.950', ['_light'])).toBe(true)
    expect(result.stylesheet).toContain(
      '[data-color-mode=dark] .\\@reference-ui\\/lib__dark\\:bg_gray\\.900'
    )
    expect(result.stylesheet).toContain(
      '[data-color-mode=light] .\\@reference-ui\\/lib__light\\:c_gray\\.950'
    )
    expect(result.stylesheet).not.toContain('.dark .')
    expect(result.stylesheet).not.toContain('.light .')
    expect(result.stylesheet).not.toContain('data-panda-theme')
    expect(result.stylesheet).not.toContain('[data-theme=')
  },
}

export default spec
