/**
 * Dynamic-sibling extract station. Unresolvable properties and call-expression
 * ternary arms diagnose; static neighbours and the literal arm still become wants.
 */
import { expect } from 'vitest'
import { getWantsForProp, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-LEAF-07',
  ids: ['ATM-LEAF-07', 'ATM-DIAG-02'],
  verify(result) {
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(hasWant(result, 'height', '100px')).toBe(true)
    expect(hasWant(result, 'color', 'black')).toBe(true)
    expect(getWantsForProp(result, 'color').length).toBeGreaterThanOrEqual(2)
    expect(result.diagnostics.length).toBeGreaterThanOrEqual(1)
  },
}

export default spec
