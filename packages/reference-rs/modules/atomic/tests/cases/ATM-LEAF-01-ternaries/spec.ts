/**
 * Ternary extract station. Both literal arms become wants; undefined and
 * void 0 branches are dropped. Nested and flat forms share one compile.
 */
import { expect } from 'vitest'
import { getWantsForProp, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-LEAF-01',
  verify(result) {
    expect(hasWant(result, 'bg', 'n300')).toBe(true)
    expect(hasWant(result, 'bg', 'n100')).toBe(true)
    expect(hasWant(result, 'borderBottom', '3px solid')).toBe(true)
    expect(hasWant(result, 'borderBottom', '3px solid transparent')).toBe(true)
    expect(getWantsForProp(result, 'borderBottom')).toHaveLength(2)
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(hasWant(result, 'bg', 'blue')).toBe(true)
    expect(hasWant(result, 'color', 'white')).toBe(true)
    expect(hasWant(result, 'color', 'black')).toBe(true)
    expect(hasWant(result, 'fontSize', '12px')).toBe(true)
    expect(hasWant(result, 'fontSize', '14px')).toBe(true)
    expect(hasWant(result, 'fontSize', '16px')).toBe(true)
    expect(hasWant(result, 'fontSize', '18px')).toBe(true)
    expect(getWantsForProp(result, 'fontSize')).toHaveLength(4)
    expect(result.diagnostics).toHaveLength(0)
  },
}

export default spec
