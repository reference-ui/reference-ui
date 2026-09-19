/**
 * Cross-file refuse station (SPEC-V2-54 SUPERIOR, SPEC-V2-58). An
 * unresolvable specifier, a missing export, and a bare imported function
 * value each warn once and mint nothing while static siblings extract —
 * fail-closed-plus-diagnostic where v2 drops silently.
 */
import { expect } from 'vitest'
import { harvestWants, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-75',
  verify(result) {
    expect(hasWant(result, 'color', 'ghost')).toBe(false)
    expect(hasWant(result, 'margin', 'nope')).toBe(false)
    expect(hasWant(result, 'padding', '4px')).toBe(true)
    expect(hasWant(result, 'padding', '8px')).toBe(true)
    expect(hasWant(result, 'padding', '12px')).toBe(true)
    // The three refused positions harvest red (color, borderColor) plus
    // the three pool lengths onto the margin sink.
    expect(harvestWants(result)).toHaveLength(5)

    const diagnostics = result.diagnostics ?? []
    const warnings = diagnostics.filter(d => d.severity === 'warning')
    const infos = diagnostics.filter(d => d.severity === 'info')
    expect(warnings).toHaveLength(3)
    for (const diagnostic of warnings) {
      expect(diagnostic.message).toMatch(/Dynamic non-literal/)
    }
    expect(infos).toHaveLength(3)
    for (const d of infos) {
      expect(d.code).toBe('ATM-I-HARVEST-SINK')
    }
  },
}

export default spec
