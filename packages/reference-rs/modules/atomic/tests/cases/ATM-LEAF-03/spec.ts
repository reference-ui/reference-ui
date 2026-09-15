/**
 * Undefined-omission station. Ternary arms that are `undefined` or `void 0`
 * do not become wants. Only the defined literal arm is pushed.
 */
import { expect } from 'vitest'
import { getWantsForProp, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-LEAF-03',
  verify(result) {
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(hasWant(result, 'bg', 'blue')).toBe(true)
    expect(getWantsForProp(result, 'color')).toHaveLength(1)
    expect(getWantsForProp(result, 'bg')).toHaveLength(1)
  },
}

export default spec
