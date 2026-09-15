/**
 * Hover preset station. `_hover` lowers to `&:is(:hover, [data-hover])`
 * and that selector is applied to the class. Nested chains are ATM-COND-04.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-COND-02',
  verify(result) {
    expect(hasWant(result, 'color', 'red.500', ['_hover'])).toBe(true)
    expect(result.stylesheet).toContain('.hover\\:c_red\\.500:is(:hover, [data-hover])')
  },
}

export default spec
