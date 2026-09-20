/**
 * Partial-ternary station (SPEC-V2-16 GAP-16). An open-test ternary with one
 * unresolvable arm keeps the resolvable arm as a want plus its runtime style
 * plan, and warns exactly once on the dynamic arm, in both arm positions.
 */
import { expect } from 'vitest'
import { compileCase, harvestWants, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-63',
  async verify(result) {
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

    // Arm refusals ride the opt-in channel now (S6 E8-class re-point);
    // the default is silent.
    expect(result.diagnostics ?? []).toHaveLength(0)
    const opted = await compileCase('ATM-SITE-63', { logs: ['compiler'] })
    expect(opted.compilerDiagnostics, 'opt-in channel populates').toBeDefined()
    const channel = opted.compilerDiagnostics ?? []
    const warnings = channel.filter(d => d.severity === 'warning')
    const infos = channel.filter(d => d.code === 'ATM-I-HARVEST-SINK')
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
