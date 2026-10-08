/**
 * Diagnostic-location station. Unresolvable identifiers, template
 * interpolations, and computed keys warn with a file path and do not abort.
 * (S6 E8-class re-point: refusal/harvest lines ride the opt-in compiler
 * channel with their locations intact; the default channel is silent.)
 */
import { expect } from 'vitest'
import { compileCase, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-DIAG-02',
  async verify(result) {
    expect(hasWant(result, 'mt', '2r')).toBe(true)

    // The refusals prove no exact runtime miss, so the default is silent.
    expect(result.diagnostics ?? []).toHaveLength(0)

    // Opt-in: the same located lines are visible on the compiler channel.
    const opted = await compileCase('ATM-DIAG-02', { logs: ['compiler'] })
    expect(opted.compilerDiagnostics, 'opt-in channel populates').toBeDefined()
    const channel = (opted.compilerDiagnostics ?? []).filter(
      d => d.code !== 'ATM-I-EXPECTED-LOOKUP' && d.code !== 'ATM-I-DYNAMIC-SLOT'
    )
    const warnings = channel.filter(d => d.severity === 'warning')
    const infos = channel.filter(d => d.severity === 'info')
    expect(warnings.length).toBeGreaterThanOrEqual(1)
    for (const d of channel) {
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
