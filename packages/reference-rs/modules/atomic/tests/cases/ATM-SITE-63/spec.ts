/**
 * Partial-ternary station (SPEC-V2-16 GAP-16). An open-test ternary with one
 * unresolvable arm keeps the resolvable arm as a want plus its runtime style
 * plan, and warns exactly once on the dynamic arm, in both arm positions.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-63',
  verify(result) {
    expect(hasWant(result, 'color', 'black')).toBe(true)
    expect(hasWant(result, 'backgroundColor', 'white')).toBe(true)

    const plans = result.runtime.stylePlans
    expect(plans.find(p => p.prop === 'color' && p.value === 'black')).toBeDefined()
    expect(
      plans.find(p => p.prop === 'backgroundColor' && p.value === 'white'),
    ).toBeDefined()

    const diagnostics = result.diagnostics ?? []
    expect(diagnostics).toHaveLength(2)
    for (const diagnostic of diagnostics) {
      expect(diagnostic.severity).toBe('warning')
      expect(diagnostic.message).toMatch(/Dynamic non-literal/)
    }
    expect(diagnostics.map(d => d.line).sort()).toEqual([7, 9])
  },
}

export default spec
