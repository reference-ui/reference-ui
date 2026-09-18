/**
 * Const-branch station (ATM-SITE-23, RS-37). A `const` bound to a ternary
 * or logical of literals — in a component body or top-level — behaves like
 * the inline branch: one want and one runtime style plan per literal leaf.
 * Fully dynamic identifiers still warn and mint nothing.
 */
import { expect } from 'vitest'
import { createStylePlanIndex, mergeStylePlans } from '../../../js/index.js'
import { hasWant, layerClassNames, type AtomicCaseSpec } from '../../helpers.js'

const SYSTEM = '@reference-ui/lib'

const EXPECTED: Array<{ prop: string; value: string; classNames: string[] }> = [
  { prop: 'p', value: '3r', classNames: [`${SYSTEM}__p_3r`] },
  {
    prop: 'borderBottom',
    value: '1px solid',
    classNames: [`${SYSTEM}__bd-b-w_1px`, `${SYSTEM}__bd-b-s_solid`],
  },
  {
    prop: 'borderBottomColor',
    value: 'gray.800',
    classNames: [`${SYSTEM}__bd-b-c_gray.800`],
  },
  {
    prop: 'borderBottomColor',
    value: 'gray.200',
    classNames: [`${SYSTEM}__bd-b-c_gray.200`],
  },
  {
    prop: 'borderBottomColor',
    value: 'gray.700',
    classNames: [`${SYSTEM}__bd-b-c_gray.700`],
  },
  { prop: 'color', value: 'red.500', classNames: [`${SYSTEM}__c_red.500`] },
  { prop: 'color', value: 'blue.500', classNames: [`${SYSTEM}__c_blue.500`] },
  { prop: 'color', value: 'green.500', classNames: [`${SYSTEM}__c_green.500`] },
  { prop: 'color', value: 'amber.500', classNames: [`${SYSTEM}__c_amber.500`] },
]

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-23',
  verify(result) {
    for (const { prop, value } of EXPECTED) {
      expect(hasWant(result, prop, value)).toBe(true)
    }
    expect(hasWant(result, 'borderBottomColor', 'unknownToken')).toBe(false)

    const plans = result.runtime.stylePlans
    expect(plans).toHaveLength(EXPECTED.length)
    const emitted = new Set(Object.values(result.css?.classes ?? {}))
    for (const { prop, value, classNames } of EXPECTED) {
      const plan = plans.find(p => p.prop === prop && p.value === value)
      expect(plan).toBeDefined()
      expect(plan!.system).toBe(SYSTEM)
      expect(plan!.when).toEqual([])
      expect(plan!.important).toBe(false)
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

    const index = createStylePlanIndex(result.runtime)
    for (const { prop, value, classNames } of EXPECTED) {
      const merged = mergeStylePlans(index, [{ system: SYSTEM, prop, value }])
      for (const className of classNames) {
        expect(merged).toContain(className)
      }
    }

    expect(result.css?.classes?.['borderBottomColor:gray.800']).toBe(
      `${SYSTEM}__bd-b-c_gray.800`,
    )
    expect(result.css?.classes?.['borderBottomColor:gray.200']).toBe(
      `${SYSTEM}__bd-b-c_gray.200`,
    )

    const sheet = result.stylesheet
    expect(sheet).toContain('border-bottom-color: var(--colors-gray-800);')
    expect(sheet).toContain('border-bottom-color: var(--colors-gray-200);')
    expect(sheet).toContain('border-bottom-color: var(--colors-gray-700);')

    expect(result.diagnostics).toHaveLength(1)
    expect(result.diagnostics[0]!.severity).toBe('warning')
    expect(result.diagnostics[0]!.message).toMatch(/unknownToken/)
  },
}

export default spec
