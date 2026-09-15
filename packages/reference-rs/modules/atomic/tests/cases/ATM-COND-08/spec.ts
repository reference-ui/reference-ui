/**
 * Host color-mode station. `_dark` / `_light` wrap with
 * `[data-panda-theme=…]`, not `.dark` / `.light`.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-COND-08',
  verify(result) {
    expect(hasWant(result, 'bg', 'gray.900', ['_dark'])).toBe(true)
    expect(hasWant(result, 'color', 'gray.950', ['_light'])).toBe(true)
    expect(result.stylesheet).toContain(
      '[data-panda-theme=dark] .dark\\:bg_gray\\.900'
    )
    expect(result.stylesheet).toContain(
      '[data-panda-theme=light] .light\\:c_gray\\.950'
    )
    expect(result.stylesheet).not.toContain('.dark .')
    expect(result.stylesheet).not.toContain('.light .')
  },
}

export default spec
