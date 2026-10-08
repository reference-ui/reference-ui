/**
 * Re-export identity station (ATM-SITE-55, SPEC-V2-76 rider S12). Calls and
 * hosts imported through a consumer wrapper (`export { css } from
 * '@reference-ui/react'`) extract with zero config — the binding walk
 * replaces Panda's `importMap`. Consumer declarations, foreign origins,
 * cycles, missing exports, unresolvable specifiers, and star-defaults are
 * silent non-sites: zero wants, zero diagnostics.
 */
import { expect } from 'vitest'
import { createStylePlanIndex, mergeStylePlans } from '../../../js/index.js'
import {
  getWantsForProp,
  hasWant,
  layerClassNames,
  type AtomicCaseSpec,
} from '../../helpers.js'

const SYSTEM = '@reference-ui/lib'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-55',
  verify(result) {
    // Live arms: direct + consumer alias, wrapper alias, chain, local,
    // star, namespace member, default, host, and the value control.
    expect(getWantsForProp(result, 'color')).toHaveLength(6)
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(hasWant(result, 'color', 'blue')).toBe(true)
    expect(hasWant(result, 'color', 'green')).toBe(true)
    expect(hasWant(result, 'color', 'plum')).toBe(true)
    expect(hasWant(result, 'color', 'teal')).toBe(true)
    expect(getWantsForProp(result, 'padding')).toHaveLength(2)
    expect(hasWant(result, 'padding', '4px')).toBe(true)
    expect(hasWant(result, 'padding', '8px')).toBe(true)
    expect(hasWant(result, 'margin', '2r')).toBe(true)
    expect(hasWant(result, 'mt', '2r')).toBe(true)
    // Exact total: every miss arm extracting would push this over.
    expect(result.wants).toHaveLength(10)

    // Plans dedupe by leaf: two `color: red` wants share one plan.
    expect(result.stylePlans).toHaveLength(9)

    // Both recipes extract through the wrapper: namespace and named.
    const names = Object.keys(result.runtime.recipes).sort()
    expect(names).toEqual(['@reference-ui/lib__site55named', '@reference-ui/lib__site55ns'])
    expect(result.stylesheet).toContain('@layer recipes')

    // Every runtime class resolves and lands in the utilities layer.
    const classes = result.css?.classes ?? {}
    expect(Object.keys(classes)).toHaveLength(9)
    const utilities = layerClassNames(result.stylesheet, 'utilities')
    for (const name of Object.values(classes)) {
      expect(utilities.has(name)).toBe(true)
    }

    const index = createStylePlanIndex(result.stylePlans)
    expect(
      mergeStylePlans(index, [{ system: SYSTEM, prop: 'color', value: 'red' }])
    ).toContain(`${SYSTEM}__c_red`)

    // Miss arms are silent non-sites (SPEC-V2-38 precedent): no wants
    // from them (pinned by the exact counts above) and no diagnostics.
    expect(result.diagnostics).toHaveLength(0)
  },
}

export default spec
