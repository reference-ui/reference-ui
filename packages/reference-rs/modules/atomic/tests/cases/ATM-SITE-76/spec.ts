/**
 * Import-identity station (SPEC-V2-59 alias + I2 arms). Aliased, named
 * multi-declaration, and string-literal `css` imports are all live sites.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-76',
  verify(result) {
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(hasWant(result, 'padding', '4px')).toBe(true)
    expect(hasWant(result, 'margin', '8px')).toBe(true)
    expect(hasWant(result, 'mt', '2r')).toBe(true)
    expect(result.diagnostics).toEqual([])
  },
}

export default spec
