/**
 * Scope-chain station (ATM-SITE-53, SPEC-V2-75). A value-position identifier
 * resolves through its binding: a `Card({ color })` param shadows the
 * cross-file `export const color` (diagnostic, zero wants), an inner `const`
 * shadows an outer same-named const (innermost leaves only), and imported
 * plus genuinely unbound names keep resolving through the import stub.
 */
import { expect } from 'vitest'
import { createStylePlanIndex, mergeStylePlans } from '../../../js/index.js'
import { hasWant, layerClassNames, type AtomicCaseSpec } from '../../helpers.js'

const SYSTEM = '@reference-ui/lib'

const EXPECTED: Array<{ prop: string; value: string; classNames: string[] }> = [
  { prop: 'color', value: 'blue.500', classNames: [`${SYSTEM}__c_blue.500`] },
  { prop: 'color', value: 'red.500', classNames: [`${SYSTEM}__c_red.500`] },
  { prop: 'color', value: 'gray.700', classNames: [`${SYSTEM}__c_gray.700`] },
  {
    prop: 'backgroundColor',
    value: 'amber.500',
    classNames: [`${SYSTEM}__bg-c_amber.500`],
  },
]

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-53',
  verify(result) {
    for (const { prop, value } of EXPECTED) {
      expect(hasWant(result, prop, value)).toBe(true)
    }
    // The param shadows the cross-file const: no `color: amber.500` ghost.
    expect(hasWant(result, 'color', 'amber.500')).toBe(false)
    // Innermost wins, nothing unions: exactly the four wants above.
    expect(result.wants).toHaveLength(EXPECTED.length)

    const plans = result.runtime.stylePlans
    expect(plans).toHaveLength(EXPECTED.length)
    const emitted = new Set(Object.values(result.css?.classes ?? {}))
    for (const { prop, value, classNames } of EXPECTED) {
      const plan = plans.find(p => p.prop === prop && p.value === value)
      expect(plan).toBeDefined()
      expect(plan!.system).toBe(SYSTEM)
      expect(plan!.when).toEqual([])
      expect(plan!.declarations.length).toBeGreaterThan(0)
      for (const decl of plan!.declarations) {
        expect(emitted.has(decl.className)).toBe(true)
      }
      for (const className of classNames) {
        expect(plan!.declarations.map(d => d.className)).toContain(className)
      }
    }

    const utilities = layerClassNames(result.stylesheet, 'utilities')
    for (const { classNames } of EXPECTED) {
      for (const className of classNames) {
        expect(utilities).toContain(className)
      }
    }
    expect(utilities).not.toContain(`${SYSTEM}__c_amber.500`)

    const index = createStylePlanIndex(result.runtime)
    for (const { prop, value, classNames } of EXPECTED) {
      const merged = mergeStylePlans(index, [{ system: SYSTEM, prop, value }])
      for (const className of classNames) {
        expect(merged).toContain(className)
      }
    }

    expect(result.diagnostics).toHaveLength(1)
    expect(result.diagnostics[0]!.severity).toBe('warning')
    expect(result.diagnostics[0]!.message).toMatch(
      /Dynamic non-literal identifier 'color'/
    )
    expect(result.diagnostics[0]!.file).toMatch(/Card\.tsx$/)
  },
}

export default spec
