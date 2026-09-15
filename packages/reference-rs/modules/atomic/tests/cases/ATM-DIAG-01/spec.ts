/**
 * Clean-diagnostics station. Valid StyleProps and css() produce no warnings
 * or errors.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-DIAG-01',
  verify(result) {
    expect(result.diagnostics).toEqual([])
    expect(hasWant(result, 'mt', '2r')).toBe(true)
    expect(hasWant(result, 'color', 'red')).toBe(true)
  },
}

export default spec
