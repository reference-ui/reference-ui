/**
 * Plan parity station (RS-14). Every want emits a runtime style plan: ternary
 * arms, member access, and identifier spreads resolve through the same plan
 * index as direct literals, so runtime css() never returns '' for a leaf the
 * sheet printed. Covers css() and JSX, which share the authored capture.
 */
import { expect } from 'vitest'
import { createStylePlanIndex, mergeStylePlans } from '../../../js/index.js'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const EXPECTED: Array<[string, string]> = [
  ['color', 'cherry'],
  ['color', 'ocean'],
  ['color', 'teal'],
  ['bg', 'amber'],
  ['mt', '2r'],
  ['bg', 'lime'],
  ['bg', 'sky'],
  ['p', '1r'],
]

const spec: AtomicCaseSpec = {
  id: 'ATM-SEAM-03',
  verify(result) {
    for (const [prop, value] of EXPECTED) {
      expect(hasWant(result, prop, value), `want (${prop}, ${value})`).toBe(true)
    }

    const system = result.stylePlans[0]?.system ?? '@reference-ui/lib'
    const index = createStylePlanIndex(result.stylePlans)
    for (const [prop, value] of EXPECTED) {
      const plan = result.stylePlans.find(
        p => p.prop === prop && p.value === value && p.when.length === 0
      )
      expect(plan, `plan (${prop}, ${value})`).toBeDefined()
      expect(plan!.declarations.length).toBeGreaterThan(0)
      const merged = mergeStylePlans(index, [{ system, prop, value }])
      expect(merged, `index resolves (${prop}, ${value})`).toBe(
        result.css?.classes?.[`${prop}:${value}`]
      )
    }

    expect(result.diagnostics).toEqual([])
  },
}

export default spec
