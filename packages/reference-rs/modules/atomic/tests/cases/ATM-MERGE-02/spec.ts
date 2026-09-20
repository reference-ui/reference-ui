/**
 * Property alias and duplicate key collapse station (ATM-MERGE-02).
 * Asserts that aliases and duplicate keys resolve to the last authored value per cascade slot.
 */
import { expect } from 'vitest'
import { createStylePlanIndex, mergeStylePlans } from '../../../js/index.js'
import { layerClassNames, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-MERGE-02',
  verify(result) {
    const utilities = layerClassNames(result.stylesheet, 'utilities')
    expect(utilities).toContain('@reference-ui/lib__bg_n100')
    expect(utilities).toContain('@reference-ui/lib__bg_n200')
    expect(utilities).toContain('@reference-ui/lib__c_red.500')
    expect(utilities).toContain('@reference-ui/lib__c_blue.500')
    expect(utilities).toContain('@reference-ui/lib__p_1r')

    const index = createStylePlanIndex(result.stylePlans)

    // Pair 1: bg: 'n100' and background: 'n200' collapse to background slot
    const merged1 = mergeStylePlans(index, [
      { system: '@reference-ui/lib', prop: 'bg', value: 'n100' },
      { system: '@reference-ui/lib', prop: 'background', value: 'n200' },
    ])
    expect(merged1).toBe('@reference-ui/lib__bg_n200')

    // Pair 2: color: 'red.500', padding: '1r', color: 'blue.500'
    // color collapses to c_blue.500, padding: 1r remains p_1r
    const merged2 = mergeStylePlans(index, [
      { system: '@reference-ui/lib', prop: 'color', value: 'red.500' },
      { system: '@reference-ui/lib', prop: 'padding', value: '1r' },
      { system: '@reference-ui/lib', prop: 'color', value: 'blue.500' },
    ])
    expect(merged2).toContain('@reference-ui/lib__c_blue.500')
    expect(merged2).not.toContain('@reference-ui/lib__c_red.500')
    expect(merged2).toContain('@reference-ui/lib__p_1r')

    expect(result.diagnostics).toHaveLength(0)
  },
}

export default spec
