/**
 * Indirection station (ATM-SITE-17, RS-14). Ternary arms, member access,
 * and identifier spreads already emit wants and utilities; this station
 * proves they also emit one runtime style plan per want, each pointing
 * at its emitted utility, so the runtime plan index resolves every leaf.
 */
import { expect } from 'vitest'
import { createStylePlanIndex, mergeStylePlans } from '../../../js/index.js'
import { hasWant, layerClassNames, type AtomicCaseSpec } from '../../helpers.js'

const SYSTEM = '@reference-ui/lib'

const EXPECTED: Array<{ prop: string; value: string; className: string }> = [
  { prop: 'color', value: 'red.500', className: `${SYSTEM}__c_red.500` },
  { prop: 'color', value: 'blue.500', className: `${SYSTEM}__c_blue.500` },
  { prop: 'color', value: 'green.500', className: `${SYSTEM}__c_green.500` },
  { prop: 'color', value: 'amber.500', className: `${SYSTEM}__c_amber.500` },
  { prop: 'mt', value: '2r', className: `${SYSTEM}__mt_2r` },
]

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-17',
  verify(result) {
    for (const { prop, value } of EXPECTED) {
      expect(hasWant(result, prop, value)).toBe(true)
    }

    const plans = result.stylePlans
    expect(plans).toHaveLength(EXPECTED.length)
    const emitted = new Set(Object.values(result.css?.classes ?? {}))
    for (const { prop, value, className } of EXPECTED) {
      const plan = plans.find(p => p.prop === prop && p.value === value)
      expect(plan).toBeDefined()
      expect(plan!.system).toBe(SYSTEM)
      expect(plan!.when).toEqual([])
      expect(plan!.important).toBe(false)
      expect(plan!.declarations.length).toBeGreaterThan(0)
      for (const decl of plan!.declarations) {
        expect(emitted.has(decl.className)).toBe(true)
      }
      expect(plan!.declarations.map(d => d.className)).toContain(className)
    }

    const utilities = layerClassNames(result.stylesheet, 'utilities')
    for (const { className } of EXPECTED) {
      expect(utilities).toContain(className)
    }

    const index = createStylePlanIndex(result.stylePlans)
    for (const { prop, value, className } of EXPECTED) {
      expect(mergeStylePlans(index, [{ system: SYSTEM, prop, value }])).toBe(
        className,
      )
    }

    expect(result.diagnostics).toEqual([])
  },
}

export default spec
