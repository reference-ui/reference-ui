/**
 * Dark preset station. `_dark` lowers to `[data-color-mode=dark] &` and
 * applies as `[data-color-mode=dark] .<system>__dark\:…`. Host attribute
 * proof is ATM-COND-08. Nested chains are ATM-COND-04.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-COND-03',
  verify(result) {
    expect(hasWant(result, 'bg', 'gray.900', ['_dark'])).toBe(true)
    expect(result.stylesheet).toContain(
      '[data-color-mode=dark] .\\@reference-ui\\/lib__dark\\:bg_gray\\.900'
    )
  },
}

export default spec
