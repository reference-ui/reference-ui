/**
 * Parent-combinator station (ATM-COND-20, RS-12). Keys that carry an
 * unquoted `&` without starting with it (`'input:hover &'`,
 * `':focus > &'`) extract as selector conditions and emit with the
 * parent selector ahead of the utility class. Covers the COND-05 and
 * COND-10 waiting rows with one station per the RS-9 precedent.
 */
import { expect } from 'vitest'
import { createStylePlanIndex, mergeStylePlans } from '../../../js/index.js'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const SYSTEM = '@reference-ui/lib'

const EXPECTED = [
  {
    when: 'input:hover &',
    value: 'red.500',
    className: `${SYSTEM}__[input:hover_&]:c_red.500`,
    rule: 'input:hover .\\@reference-ui\\/lib__\\[input\\:hover_\\&\\]\\:c_red\\.500',
  },
  {
    when: ':focus > &',
    value: 'blue.500',
    className: `${SYSTEM}__[:focus_>_&]:c_blue.500`,
    rule: ':focus > .\\@reference-ui\\/lib__\\[\\:focus_\\>_\\&\\]\\:c_blue\\.500',
  },
]

const spec: AtomicCaseSpec = {
  id: 'ATM-COND-20',
  verify(result) {
    for (const { when, value } of EXPECTED) {
      expect(hasWant(result, 'color', value, [when])).toBe(true)
    }

    const plans = result.stylePlans
    expect(plans).toHaveLength(EXPECTED.length)
    for (const { when, value, className } of EXPECTED) {
      const plan = plans.find(p => p.prop === 'color' && p.value === value)
      expect(plan).toBeDefined()
      expect(plan!.when).toEqual([when])
      expect(plan!.declarations.map(d => d.className)).toContain(className)
    }

    for (const { rule } of EXPECTED) {
      expect(result.stylesheet).toContain(rule)
    }

    const index = createStylePlanIndex(result.stylePlans)
    for (const { when, value, className } of EXPECTED) {
      expect(
        mergeStylePlans(index, [{ system: SYSTEM, when: [when], prop: 'color', value }]),
      ).toBe(className)
    }

    expect(result.diagnostics).toEqual([])
  },
}

export default spec
