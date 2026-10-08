/**
 * Shadow-decision station (ATM-SITE-52, SPEC-V2-74). A JSX tag shadowed by
 * a param stays fail-closed and silent (zero wants, zero diagnostics), the
 * unshadowed control extracts, and an `undefined` shadowed by a param omits
 * exactly like the bare spelling.
 */
import { expect } from 'vitest'
import { createStylePlanIndex, mergeStylePlans } from '../../../js/index.js'
import { hasWant, layerClassNames, type AtomicCaseSpec } from '../../helpers.js'

const SYSTEM = '@reference-ui/lib'
const MT_CLASS = `${SYSTEM}__mt_2r`

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-52',
  verify(result) {
    // Only the unshadowed control tag extracts; the param-shadowed tag
    // contributes nothing.
    expect(hasWant(result, 'mt', '2r')).toBe(true)
    expect(result.wants).toHaveLength(1)

    const plans = result.stylePlans
    expect(plans).toHaveLength(1)
    const plan = plans[0]!
    expect(plan.prop).toBe('mt')
    expect(plan.value).toBe('2r')
    expect(plan.system).toBe(SYSTEM)
    expect(plan.when).toEqual([])
    expect(plan.declarations.length).toBeGreaterThan(0)
    const emitted = new Set(Object.values(result.css?.classes ?? {}))
    for (const decl of plan.declarations) {
      expect(emitted.has(decl.className)).toBe(true)
    }
    expect(plan.declarations.map(d => d.className)).toContain(MT_CLASS)

    const utilities = layerClassNames(result.stylesheet, 'utilities')
    expect(utilities).toContain(MT_CLASS)

    const index = createStylePlanIndex(result.stylePlans)
    expect(mergeStylePlans(index, [{ system: SYSTEM, prop: 'mt', value: '2r' }])).toContain(
      MT_CLASS
    )

    // Both shadow shapes and both `undefined` leaves stay silent.
    expect(result.diagnostics).toEqual([])
  },
}

export default spec
