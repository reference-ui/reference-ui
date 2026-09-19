/**
 * Aliased-import station (ATM-SITE-40, SPEC-V2-52 + entry-54 remainder +
 * import cycles). A consumer alias resolves to the declared export in THAT
 * file through scalars, object spreads, member reads, and array indices;
 * a missing export and three cycle shapes each warn once with siblings
 * kept — fail-closed-plus-diagnostic where v2 drops silently.
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

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-40',
  verify(result) {
    // Aliased scalar, object (spread + member), and array-index reads.
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(getWantsForProp(result, 'color')).toHaveLength(3)
    expect(hasWant(result, 'padding', '4px')).toBe(true)
    expect(hasWant(result, 'margin', '8px')).toBe(true)
    // Sibling paddings behind the missing export and the three cycles.
    expect(hasWant(result, 'padding', '12px')).toBe(true)
    expect(hasWant(result, 'padding', '16px')).toBe(true)
    expect(hasWant(result, 'padding', '20px')).toBe(true)
    expect(hasWant(result, 'padding', '24px')).toBe(true)
    expect(result.wants).toHaveLength(9)

    // One runtime plan per unique leaf.
    const plans = result.runtime.stylePlans
    expect(plans).toHaveLength(8)
    for (const [prop, value] of [
      ['color', 'red'],
      ['color', 'blue'],
      ['padding', '4px'],
      ['margin', '8px'],
      ['padding', '12px'],
      ['padding', '16px'],
      ['padding', '20px'],
      ['padding', '24px'],
    ] as const) {
      expect(plans.some(p => p.prop === prop && p.value === value)).toBe(true)
    }
    const emitted = new Set(Object.values(result.css?.classes ?? {}))
    for (const plan of plans) {
      expect(plan.system).toBe(SYSTEM)
      for (const decl of plan.declarations) {
        expect(emitted.has(decl.className)).toBe(true)
      }
    }

    const utilities = layerClassNames(result.stylesheet, 'utilities')
    expect(utilities).toContain(RED_CLASS)

    const index = createStylePlanIndex(result.runtime)
    expect(
      mergeStylePlans(index, [{ system: SYSTEM, prop: 'color', value: 'red' }]),
    ).toContain(RED_CLASS)

    // The missing export and the three cycles each warn once, located,
    // with siblings kept. Cycle names are declared nowhere, so the
    // merge-bag fallback genuinely misses and the guard stays observable.
    const diagnostics = result.diagnostics ?? []
    expect(diagnostics).toHaveLength(4)
    for (const expected of [
      {
        file: 'missing.ts',
        line: 6,
        code: 'ATM-W-DYNAMIC-IDENTIFIER',
        message: "Dynamic non-literal identifier 'nah'",
      },
      {
        file: 'cycled.ts',
        line: 7,
        code: 'ATM-W-UNFOLDABLE-SPREAD',
        message: 'Dynamic object spread',
      },
      {
        file: 'v2cycled.ts',
        line: 7,
        code: 'ATM-W-DYNAMIC-IDENTIFIER',
        message: "Dynamic non-literal identifier 'whirl'",
      },
      {
        file: 'selfed.ts',
        line: 6,
        code: 'ATM-W-DYNAMIC-IDENTIFIER',
        message: "Dynamic non-literal identifier 'spin'",
      },
    ]) {
      const match = diagnostics.find(
        d =>
          d.file?.endsWith(expected.file) &&
          d.line === expected.line &&
          d.message.includes(expected.message),
      )
      expect(match, `missing ${expected.file}:${expected.line} ${expected.message}`).toBeDefined()
      expect(match!.severity).toBe('warning')
      expect(match!.code).toBe(expected.code)
      expect(match!.column).toBeDefined()
    }
  },
}

export default spec
