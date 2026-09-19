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
    const warnings = result.diagnostics.filter(d => d.severity === 'warning')
    const infos = result.diagnostics.filter(d => d.severity === 'info')
    expect(warnings.length).toBeGreaterThanOrEqual(1)
    for (const d of result.diagnostics) {
      expect(d.file).toBeTruthy()
      expect(d.message.length).toBeGreaterThan(0)
    }
    // Harvest infos locate like warnings: every info is a sink count.
    for (const d of infos) {
      expect(d.code).toBe('ATM-I-HARVEST-SINK')
    }
    expect(result.stylesheet).toContain('@layer utilities')
  },
}

export default spec
