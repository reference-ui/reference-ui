/**
 * Responsive `r` station. Numeric and named keys become `@container`
 * wrappers. Unknown names warn and do not emit a rule.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-COND-07',
  verify(result) {
    expect(hasWant(result, 'p', '1r', ['@container (min-width: 300px)'])).toBe(true)
    expect(hasWant(result, 'mt', '2r', ['@container (min-width: 768px)'])).toBe(true)
    expect(hasWant(result, 'p', '3r')).toBe(false)
    expect(result.stylesheet).toContain('@container (min-width: 300px)')
    expect(result.stylesheet).toContain('@container (min-width: 768px)')
    expect(result.diagnostics).toHaveLength(1)
    expect(result.diagnostics[0]?.message).toContain('wat')
  },
}

export default spec
