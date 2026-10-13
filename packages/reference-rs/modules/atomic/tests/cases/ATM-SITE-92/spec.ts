/**
 * Exports-condition station (ATM-SITE-92). `cond-pkg` nests `types` beside
 * `import` inside its `exports` condition maps, at the root and at `./tokens`.
 * Each declaration is body-less, so a consumer value read through it cannot
 * fold; each `import` target names the source that does. `App.tsx` reads both
 * values beside a literal control, and the sheet carries one class per leaf.
 */
import { expect } from 'vitest'
import { createStylePlanIndex, mergeStylePlans } from '../../../js/index.js'
import {
  getWantsForProp,
  hasWant,
  layerClassNames,
  type AtomicCaseSpec,
} from '../../harness/helpers.js'

const SYSTEM = '@reference-ui/lib'
const LEAVES = ['purple', 'blue', 'red'] as const

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-92',
  verify(result) {
    // Three color wants: the root import, the `./tokens` import, the control.
    const colors = getWantsForProp(result, 'color')
    expect(colors).toHaveLength(LEAVES.length)
    for (const value of LEAVES) {
      expect(hasWant(result, 'color', value)).toBe(true)
    }

    // One runtime plan per leaf, each naming its own emitted class.
    const plans = result.stylePlans ?? []
    expect(plans).toHaveLength(LEAVES.length)
    const utilities = layerClassNames(result.stylesheet, 'utilities')
    const index = createStylePlanIndex(plans)
    for (const value of LEAVES) {
      const className = `${SYSTEM}__c_${value}`
      const plan = plans.find(p => p.prop === 'color' && p.value === value)
      expect(plan).toBeDefined()
      expect(plan!.declarations.map(d => d.className)).toContain(className)
      expect(utilities).toContain(className)
      expect(result.stylesheet).toContain(`color: ${value};`)
      const merged = mergeStylePlans(index, [
        { system: SYSTEM, prop: 'color', value },
      ])
      expect(merged).toContain(className)
    }

    // Both imports fold from their source; nothing warns.
    expect(result.diagnostics ?? []).toHaveLength(0)
  },
}

export default spec
