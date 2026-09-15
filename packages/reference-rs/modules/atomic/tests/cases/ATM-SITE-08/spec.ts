/**
 * Styletrace gating station. Div is a Reference import and extracts.
 * Foo is a local component without StyleProps and must not extract,
 * including when it authors known style props. No PascalCase matcher.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-08',
  verify(result) {
    expect(hasWant(result, 'mt', '2r')).toBe(true)
    expect(hasWant(result, 'mt', '4r')).toBe(false)
    expect(hasWant(result, 'color', 'red')).toBe(false)
    expect(result.diagnostics).toEqual([])
  },
}

export default spec
