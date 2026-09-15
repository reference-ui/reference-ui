/**
 * Object-spread extract station. Inline spreads unpack; logical and ternary
 * spreads keep siblings and both arms. Same-key ternary spreads yield two wants.
 * Dynamic unresolvable spread guards emit diagnostic warnings.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-05',
  verify(result) {
    expect(hasWant(result, 'margin', '10px')).toBe(true)
    expect(hasWant(result, 'padding', '20px')).toBe(true)
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(hasWant(result, 'padding', '10px')).toBe(true)
    expect(hasWant(result, 'margin', '20px')).toBe(true)
    expect(result.diagnostics).toHaveLength(2)
  },
}

export default spec
