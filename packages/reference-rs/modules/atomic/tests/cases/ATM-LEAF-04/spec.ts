/**
 * Logical-operator extract station. Falsy guards still yield the literal
 * operand; || and ?? collect both literal arms and fallbacks.
 * Unresolvable dynamic identifiers emit diagnostic warnings while resolving valid operands.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-LEAF-04',
  verify(result) {
    expect(hasWant(result, 'border', '1px solid')).toBe(true)
    expect(hasWant(result, 'borderColor', 'red')).toBe(true)
    expect(hasWant(result, 'outline', '2px solid')).toBe(true)
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(hasWant(result, 'color', 'blue')).toBe(true)
    expect(hasWant(result, 'bg', 'green')).toBe(true)
    expect(hasWant(result, 'margin', '2r')).toBe(true)
    expect(result.diagnostics).toHaveLength(3)
  },
}

export default spec
