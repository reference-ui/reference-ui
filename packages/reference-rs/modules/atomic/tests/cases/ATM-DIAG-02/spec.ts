/**
 * Diagnostic-location station. Unresolvable identifiers, template
 * interpolations, and computed keys warn with a file path and do not abort.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-DIAG-02',
  verify(result) {
    expect(hasWant(result, 'mt', '2r')).toBe(true)
    expect(result.diagnostics.length).toBeGreaterThanOrEqual(1)
    for (const d of result.diagnostics) {
      expect(d.severity).toBe('warning')
      expect(d.file).toBeTruthy()
      expect(d.message.length).toBeGreaterThan(0)
    }
    expect(result.stylesheet).toContain('@layer utilities')
  },
}

export default spec
