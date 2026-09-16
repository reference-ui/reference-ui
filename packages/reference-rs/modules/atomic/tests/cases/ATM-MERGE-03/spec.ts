/**
 * Array argument in css() station (ATM-MERGE-03).
 * Asserts that array arguments in css() act as unconditioned merge lists,
 * skipping false without diagnostics, and applying no breakpoint conditions.
 */
import { expect } from 'vitest'
import {
  createStylePlanIndex,
  mergeStylePlans,
} from '../../../js/index.js'
import { layerClassNames, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-MERGE-03',
  verify(result) {
    const utilities = layerClassNames(result.stylesheet, 'utilities')
    expect(utilities).toContain('@reference-ui/lib__m_1r')
    expect(utilities).toContain('@reference-ui/lib__m_3r')

    // No media or container query breakpoint wrappers should enclose m_1r or m_3r
    expect(result.stylesheet).not.toMatch(/@container[^{]*{[^}]*\.\\@reference-ui\\\/lib__m_1r/)
    expect(result.stylesheet).not.toMatch(/@container[^{]*{[^}]*\.\\@reference-ui\\\/lib__m_3r/)
    expect(result.stylesheet).not.toMatch(/@media[^{]*{[^}]*\.\\@reference-ui\\\/lib__m_1r/)
    expect(result.stylesheet).not.toMatch(/@media[^{]*{[^}]*\.\\@reference-ui\\\/lib__m_3r/)

    // Plans must carry empty when
    const plans = result.runtime.stylePlans.filter(p => p.prop === 'margin')
    expect(plans.length).toBeGreaterThanOrEqual(2)
    for (const plan of plans) {
      expect(plan.when).toEqual([])
    }

    const index = createStylePlanIndex(result.runtime)
    const merged = mergeStylePlans(index, [
      { system: '@reference-ui/lib', prop: 'margin', value: '1r' },
      { system: '@reference-ui/lib', prop: 'margin', value: '3r' },
    ])
    expect(merged).toBe('@reference-ui/lib__m_3r')

    expect(result.diagnostics).toHaveLength(0)
  },
}

export default spec
