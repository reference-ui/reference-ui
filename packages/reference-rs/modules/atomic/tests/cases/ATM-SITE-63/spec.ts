/**
 * Partial-ternary station (SPEC-V2-16 GAP-16). An open-test ternary with one
 * unresolvable arm keeps the resolvable arm as a want plus its runtime style
 * plan, and warns exactly once on the dynamic arm, in both arm positions.
 */
import { expect } from 'vitest'
import { harvestWants, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-63',
  verify(result) {
    expect(hasWant(result, 'color', 'black')).toBe(true)
    expect(hasWant(result, 'backgroundColor', 'white')).toBe(true)
    // The two dynamic arms harvest the cross pairs (color white,
    // backgroundColor black); the straight pairs twin site atoms.
    expect(harvestWants(result)).toHaveLength(2)
    expect(result.wants ?? []).toHaveLength(4)

    const plans = result.runtime.stylePlans
    expect(plans.find(p => p.prop === 'color' && p.value === 'black')).toBeDefined()
    expect(
      plans.find(p => p.prop === 'backgroundColor' && p.value === 'white'),
    ).toBeDefined()
    expect(plans.find(p => p.prop === 'color' && p.value === 'white')).toBeDefined()
    expect(
      plans.find(p => p.prop === 'backgroundColor' && p.value === 'black'),
    ).toBeDefined()

    const diagnostics = result.diagnostics ?? []
    const warnings = diagnostics.filter(d => d.severity === 'warning')
    const infos = diagnostics.filter(d => d.severity === 'info')
    expect(warnings).toHaveLength(2)
    for (const diagnostic of warnings) {
      expect(diagnostic.message).toMatch(/Dynamic non-literal/)
    }
    expect(warnings.map(d => d.line).sort()).toEqual([7, 9])
    expect(infos).toHaveLength(2)
    for (const d of infos) {
      expect(d.code).toBe('ATM-I-HARVEST-SINK')
    }
  },
}

export default spec
