/**
 * Barrel-proof station (ATM-SITE-41, SPEC-V2-56 build via SPEC-V2-76).
 * Same-name chains through one, two, and three barrel hops resolve to the
 * origin const by binding, and the aliased re-export (`export { gap as
 * space }`) resolves too — the Ph2 probe's merge-era warn-and-drop is
 * the recorded before-picture (see README), not the behavior.
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
const MARGIN_CLASS = `${SYSTEM}__m_4px`

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-41',
  verify(result) {
    // One-, two-, and three-hop chains resolve, and the alias resolves.
    expect(getWantsForProp(result, 'color')).toHaveLength(3)
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(hasWant(result, 'padding', '4px')).toBe(true)
    expect(hasWant(result, 'margin', '4px')).toBe(true)
    expect(getWantsForProp(result, 'margin')).toHaveLength(1)
    expect(result.wants).toHaveLength(5)

    const plans = result.stylePlans
    // Plans dedupe by leaf: three `color: red` wants share one plan.
    expect(plans).toHaveLength(3)
    expect(plans.filter(p => p.prop === 'color' && p.value === 'red')).toHaveLength(1)
    expect(plans.filter(p => p.prop === 'padding' && p.value === '4px')).toHaveLength(1)
    expect(plans.filter(p => p.prop === 'margin' && p.value === '4px')).toHaveLength(1)
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
    expect(utilities).toContain(MARGIN_CLASS)

    const index = createStylePlanIndex(result.stylePlans)
    expect(
      mergeStylePlans(index, [{ system: SYSTEM, prop: 'color', value: 'red' }]),
    ).toContain(RED_CLASS)
    expect(
      mergeStylePlans(index, [{ system: SYSTEM, prop: 'padding', value: '4px' }]),
    ).toContain(PAD_CLASS)
    expect(
      mergeStylePlans(index, [{ system: SYSTEM, prop: 'margin', value: '4px' }]),
    ).toContain(MARGIN_CLASS)

    // Proof: every barrel shape resolves by binding, zero diagnostics.
    expect(result.diagnostics).toHaveLength(0)
  },
}

export default spec
