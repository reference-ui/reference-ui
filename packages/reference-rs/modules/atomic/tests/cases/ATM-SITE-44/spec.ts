/**
 * Param type-literal fence (ATM-SITE-44, SPEC-V2-46). Required literal members
 * fold through member reads and destructured twins (plain and rename).
 * Patterns are per-name lenient, verbatim v2's `resolve_pattern_path`:
 * rest binds the unlisted members, defaults fire only on missing keys, and
 * unresolvable names shadow while siblings fold. Untyped, optional-member,
 * partial, non-literal, and nested annotations warn per use with margin
 * siblings kept. All-or-nothing at the annotation: one unfoldable member
 * refuses the whole annotation.
 */
import { expect } from 'vitest'
import {
  compileCase,
  getWantsForProp,
  harvestWants,
  hasWant,
  siteWants,
  type AtomicCaseSpec,
} from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-44',
  async verify(result) {
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(hasWant(result, 'color', 'blue')).toBe(true)
    expect(hasWant(result, 'fontSize', 4)).toBe(true)
    expect(hasWant(result, 'padding', '4px')).toBe(true)
    expect(hasWant(result, 'padding', '8px')).toBe(true)
    for (const value of [
      '1r',
      '2r',
      '3r',
      '4r',
      '5r',
      '6r',
      '7r',
      '8r',
      '9r',
      '10r',
      '11r',
    ]) {
      expect(hasWant(result, 'margin', value)).toBe(true)
    }
    // The backgroundColor sink harvests red/blue; both color pairs twin
    // site atoms and skip, so that sink infos zero.
    expect(siteWants(result).filter(w => w.prop === 'color')).toHaveLength(7)
    expect(getWantsForProp(result, 'color')).toHaveLength(7)
    expect(getWantsForProp(result, 'fontSize')).toHaveLength(2)
    expect(hasWant(result, 'backgroundColor', 'missing')).toBe(false)
    expect(harvestWants(result)).toHaveLength(2)
    expect(result.wants ?? []).toHaveLength(24)

    // Plans dedupe by leaf: the six (color, red) wants share one plan.
    const plans = result.stylePlans
    expect(plans).toHaveLength(18)

    // Refusals + sink infos ride the opt-in channel now (S6 E8-class
    // re-point); the default is silent.
    expect(result.diagnostics ?? []).toHaveLength(0)
    const opted = await compileCase('ATM-SITE-44', { logs: ['compiler'] })
    expect(opted.compilerDiagnostics, 'opt-in channel populates').toBeDefined()
    const channel = opted.compilerDiagnostics ?? []
    const warnings = channel.filter(d => d.severity === 'warning')
    const infos = channel.filter(d => d.code === 'ATM-I-HARVEST-SINK')
    // The color sink is covered incidentally (every offered value is a
    // static plan, zero net-new): silent on the default, but its four
    // member refusals, one identifier refusal, and sink info are visible
    // opt-in beside the uncovered backgroundColor pair.
    expect(warnings).toHaveLength(6)
    const codes = warnings.map(d => d.code).sort()
    expect(codes).toEqual([
      'ATM-W-DYNAMIC-IDENTIFIER',
      'ATM-W-DYNAMIC-IDENTIFIER',
      'ATM-W-DYNAMIC-MEMBER',
      'ATM-W-DYNAMIC-MEMBER',
      'ATM-W-DYNAMIC-MEMBER',
      'ATM-W-DYNAMIC-MEMBER',
    ])
    const uncovered = warnings.find(d => d.message.match(/'missing'.*'backgroundColor'/))
    expect(uncovered, 'uncovered backgroundColor refusal visible opt-in').toBeDefined()
    expect(uncovered!.code).toBe('ATM-W-DYNAMIC-IDENTIFIER')
    expect(infos).toHaveLength(2)
    for (const d of infos) {
      expect(d.code).toBe('ATM-I-HARVEST-SINK')
    }
    expect(infos.some(d => d.message.match(/backgroundColor under \[\]/))).toBe(true)
    expect(infos.some(d => d.message.match(/color under \[\]/))).toBe(true)
  },
}

export default spec
