/**
 * Nested ternary extract station. Every reachable literal arm across nesting
 * depths becomes a want. Logical guards around the ternary do not drop
 * leaves. Undefined omission is ATM-LEAF-03.
 */
import { expect } from 'vitest'
import { getWantsForProp, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-LEAF-02',
  verify(result) {
    expect(hasWant(result, 'borderBottom', '3px solid')).toBe(true)
    expect(hasWant(result, 'borderBottom', '3px solid transparent')).toBe(true)
    expect(getWantsForProp(result, 'borderBottom')).toHaveLength(2)
    expect(hasWant(result, 'fontSize', '12px')).toBe(true)
    expect(hasWant(result, 'fontSize', '14px')).toBe(true)
    expect(hasWant(result, 'fontSize', '16px')).toBe(true)
    expect(hasWant(result, 'fontSize', '18px')).toBe(true)
    expect(getWantsForProp(result, 'fontSize')).toHaveLength(4)
  },
}

export default spec
