/**
 * Callee-identity station (ATM-SITE-36, SPEC-V2-37). Shadowed and
 * non-allowlisted callees skip silently with zero wants; self-init,
 * cycles, no-init lets, bare functions, and missing members warn once
 * each while their margin siblings extract with runtime plans.
 */
import { expect } from 'vitest'
import { getWantsForProp, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-36',
  verify(result) {
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(hasWant(result, 'padding', '4px')).toBe(true)
    for (const value of ['1r', '2r', '3r', '4r', '5r']) {
      expect(hasWant(result, 'margin', value)).toBe(true)
    }
    for (const leaked of ['blue', 'green', 'purple']) {
      expect(hasWant(result, 'color', leaked)).toBe(false)
    }
    expect(getWantsForProp(result, 'color')).toHaveLength(1)
    expect(result.wants ?? []).toHaveLength(7)

    const plans = result.runtime.stylePlans
    expect(plans).toHaveLength(7)

    const diagnostics = result.diagnostics ?? []
    expect(diagnostics).toHaveLength(5)
    for (const diagnostic of diagnostics) {
      expect(diagnostic.severity).toBe('warning')
    }
    const messages = diagnostics.map(d => d.message).join('\n')
    expect(messages).toMatch(/'s'/)
    expect(messages).toMatch(/'c1'/)
    expect(messages).toMatch(/'shade'/)
    expect(messages).toMatch(/'getColor'/)
  },
}

export default spec
