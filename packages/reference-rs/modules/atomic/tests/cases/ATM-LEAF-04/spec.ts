/**
 * Logical-operator extract station. Guards keep the guard rule; all-literal
 * non-guard operands fold to the picked operand with no dead atom.
 * Unresolvable dynamic identifiers emit diagnostic warnings while resolving valid operands.
 */
import { expect } from 'vitest'
import { getWantsForProp, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-LEAF-04',
  verify(result) {
    expect(hasWant(result, 'border', '1px solid')).toBe(true)
    expect(hasWant(result, 'borderColor', 'red')).toBe(false)
    expect(hasWant(result, 'borderColor', 0)).toBe(true)
    expect(hasWant(result, 'outline', '2px solid')).toBe(true)
    expect(hasWant(result, 'color', 'red')).toBe(true)
    // The `||` dead arm stays dead: the single `blue` is the `??` fallback.
    expect(hasWant(result, 'color', 'blue')).toBe(true)
    expect(getWantsForProp(result, 'color')).toHaveLength(2)
    expect(hasWant(result, 'bg', 'green')).toBe(true)
    expect(hasWant(result, 'margin', '2r')).toBe(true)
    expect(result.diagnostics).toHaveLength(3)
  },
}

export default spec
