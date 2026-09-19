/**
 * Barrel-probe station (ATM-SITE-41, SPEC-V2-56 probe). Same-name chains
 * through one, two, and three barrel hops resolve to the origin const
 * because the barrels are inert to the project-wide merge. The aliased
 * re-export (`export { gap as space }`) warns and drops in the merge era;
 * the Ph4 build (SPEC-V2-76 binding walk) resolves it by binding.
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
const RED_CLASS = `${SYSTEM}__c_red`
const PAD_CLASS = `${SYSTEM}__p_4px`

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-41',
  verify(result) {
    // One-, two-, and three-hop chains resolve; the alias drops.
    expect(getWantsForProp(result, 'color')).toHaveLength(3)
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(hasWant(result, 'padding', '4px')).toBe(true)
    expect(hasWant(result, 'margin', 'space')).toBe(false)
    expect(getWantsForProp(result, 'margin')).toHaveLength(0)
    expect(result.wants).toHaveLength(4)

    const plans = result.runtime.stylePlans
    // Plans dedupe by leaf: three `color: red` wants share one plan.
    expect(plans).toHaveLength(2)
    expect(plans.filter(p => p.prop === 'color' && p.value === 'red')).toHaveLength(1)
    expect(plans.filter(p => p.prop === 'padding' && p.value === '4px')).toHaveLength(1)
    const emitted = new Set(Object.values(result.css?.classes ?? {}))
    for (const plan of plans) {
      expect(plan.system).toBe(SYSTEM)
      expect(plan.when).toEqual([])
      expect(plan.declarations.length).toBeGreaterThan(0)
      for (const decl of plan.declarations) {
        expect(emitted.has(decl.className)).toBe(true)
      }
    }

    const utilities = layerClassNames(result.stylesheet, 'utilities')
    expect(utilities).toContain(RED_CLASS)
    expect(utilities).toContain(PAD_CLASS)

    const index = createStylePlanIndex(result.runtime)
    expect(
      mergeStylePlans(index, [{ system: SYSTEM, prop: 'color', value: 'red' }])
    ).toContain(RED_CLASS)
    expect(
      mergeStylePlans(index, [{ system: SYSTEM, prop: 'padding', value: '4px' }])
    ).toContain(PAD_CLASS)

    // Merge-era record for the aliased re-export: one located warning.
    expect(result.diagnostics).toHaveLength(1)
    const [diag] = result.diagnostics
    expect(diag!.severity).toBe('warning')
    expect(diag!.code).toBe('ATM-W-DYNAMIC-IDENTIFIER')
    expect(diag!.message).toMatch(/Dynamic non-literal identifier 'space'/)
    expect(diag!.file).toMatch(/Alias\.tsx$/)
    expect(diag!.line).toBe(7)
  },
}

export default spec
