/**
 * Per-shape refuse station (ATM-SITE-32, SPEC-V2-42). Nine impure shapes
 * each warn once and mint zero wants while their static margin sibling
 * extracts with a runtime plan. Doom tripwires for the Ph3 fold table.
 */
import { expect } from 'vitest'
import { getWantsForProp, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-32',
  verify(result) {
    for (const value of ['1r', '2r', '3r', '4r', '5r', '6r', '7r', '8r', '9r']) {
      expect(hasWant(result, 'margin', value)).toBe(true)
    }
    expect(getWantsForProp(result, 'color')).toHaveLength(0)
    expect(result.wants ?? []).toHaveLength(9)

    const plans = result.runtime.stylePlans
    expect(plans).toHaveLength(9)

    expect(result.diagnostics ?? []).toHaveLength(9)
    for (const diagnostic of result.diagnostics ?? []) {
      expect(diagnostic.severity).toBe('warning')
    }

    expect(result.stylesheet).toContain('margin: var(--spacing-root);')
  },
}

export default spec
