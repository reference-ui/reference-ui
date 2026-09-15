/**
 * Flat ternary extract station. Both literal arms become wants. The test
 * expression is never evaluated. Nested forms and undefined omission live
 * in ATM-LEAF-02 and ATM-LEAF-03.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-LEAF-01',
  verify(result) {
    expect(hasWant(result, 'bg', 'n300')).toBe(true)
    expect(hasWant(result, 'bg', 'n100')).toBe(true)
    expect(hasWant(result, 'color', 'white')).toBe(true)
    expect(hasWant(result, 'color', 'black')).toBe(true)
    expect(result.diagnostics).toHaveLength(0)
  },
}

export default spec
