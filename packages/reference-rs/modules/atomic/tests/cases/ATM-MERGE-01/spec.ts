/**
 * Multi-argument css() merge station (ATM-MERGE-01).
 * Asserts that @layer utilities contains both system-qualified .m_1r and
 * .m_3r, while the runtime style plan merge resolves to the last authored
 * value (m_3r).
 */
import { expect } from 'vitest'
import { createStylePlanIndex, mergeStylePlans } from '../../../js/index.js'
import { layerClassNames, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-MERGE-01',
  verify(result) {
    const utilities = layerClassNames(result.stylesheet, 'utilities')
    expect(utilities).toContain('@reference-ui/lib__m_1r')
    expect(utilities).toContain('@reference-ui/lib__m_3r')

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
