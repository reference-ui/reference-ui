/**
 * Overlapping-spread station (SPEC-V2-23 GAP-23). Two inline-object spreads
 * writing the same key mint both atoms; the runtime style-plan merge
 * resolves the slot to the last spread, matching multi-arg last-wins.
 */
import { expect } from 'vitest'
import { createStylePlanIndex, mergeStylePlans } from '../../../js/index.js'
import { hasWant, layerClassNames, type AtomicCaseSpec } from '../../helpers.js'

const SYSTEM = '@reference-ui/lib'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-67',
  verify(result) {
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(hasWant(result, 'color', 'blue')).toBe(true)

    const utilities = layerClassNames(result.stylesheet, 'utilities')
    expect(utilities).toContain(`${SYSTEM}__c_red`)
    expect(utilities).toContain(`${SYSTEM}__c_blue`)

    const index = createStylePlanIndex(result.stylePlans)
    const merged = mergeStylePlans(index, [
      { system: SYSTEM, prop: 'color', value: 'red' },
      { system: SYSTEM, prop: 'color', value: 'blue' },
    ])
    expect(merged).toBe(`${SYSTEM}__c_blue`)

    expect(result.diagnostics).toHaveLength(0)
  },
}

export default spec
