/**
 * Dark preset station. `_dark` lowers to `.dark &` and applies as
 * `.dark .dark\:…`. Nested chains are ATM-COND-04.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-COND-03',
  verify(result) {
    expect(hasWant(result, 'bg', 'gray.900', ['_dark'])).toBe(true)
    expect(result.stylesheet).toContain('.dark .dark\\:bg_gray\\.900')
  },
}

export default spec
