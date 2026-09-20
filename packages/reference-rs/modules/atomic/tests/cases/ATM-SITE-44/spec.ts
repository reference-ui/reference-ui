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
  getWantsForProp,
  harvestWants,
  hasWant,
  siteWants,
  type AtomicCaseSpec,
} from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-44',
  verify(result) {
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
    const plans = result.runtime.stylePlans
    expect(plans).toHaveLength(18)

    const diagnostics = result.diagnostics ?? []
    const warnings = diagnostics.filter(d => d.severity === 'warning')
    const infos = diagnostics.filter(d => d.severity === 'info')
    // The color sink is covered incidentally (every offered value is a
    // static plan, zero net-new): only the uncovered backgroundColor
    // refusal and its minting sink still report.
    expect(warnings).toHaveLength(1)
    expect(warnings[0]!.code).toBe('ATM-W-DYNAMIC-IDENTIFIER')
    expect(warnings[0]!.message).toMatch(/'missing'.*'backgroundColor'/)
    expect(infos).toHaveLength(1)
    expect(infos[0]!.code).toBe('ATM-I-HARVEST-SINK')
    expect(infos[0]!.message).toMatch(/backgroundColor under \[\]/)
  },
}

export default spec
