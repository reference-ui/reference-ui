/**
 * Static-computed-key station (ATM-SITE-49, SPEC-V2-64 static half).
 * `['color']`, `` [`backgroundColor`] ``, and `[42]` resolve through the
 * key table exactly like their bare spellings; genuinely dynamic keys
 * (`[key]`, `[pick()]`) warn once per member and keep static siblings.
 * Folded keys (`[k]` over `const k`, concat keys) are the Ph3 half.
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

const EXPECTED: Array<{ prop: string; value: string; className: string }> = [
  { prop: 'color', value: 'red', className: `${SYSTEM}__c_red` },
  { prop: 'backgroundColor', value: 'blue', className: `${SYSTEM}__bg-c_blue` },
  { prop: 'padding', value: '4px', className: `${SYSTEM}__p_4px` },
  { prop: 'margin', value: '4px', className: `${SYSTEM}__m_4px` },
]

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-49',
  verify(result) {
    for (const { prop, value } of EXPECTED) {
      expect(hasWant(result, prop, value)).toBe(true)
    }
    // The computed `['color']` and the bare control are the same leaf twice;
    // singletons elsewhere. Nothing mints from the dynamic or numeric keys.
    expect(getWantsForProp(result, 'color')).toHaveLength(2)
    expect(getWantsForProp(result, 'backgroundColor')).toHaveLength(1)
    expect(getWantsForProp(result, 'padding')).toHaveLength(1)
    expect(getWantsForProp(result, 'margin')).toHaveLength(1)
    expect(hasWant(result, '42', 'red')).toBe(false)
    expect(result.wants).toHaveLength(5)

    const plans = result.runtime.stylePlans
    // Plans dedupe by leaf: the doubled `color: red` want shares one plan.
    expect(plans).toHaveLength(4)
    const emitted = new Set(Object.values(result.css?.classes ?? {}))
    for (const { prop, value, className } of EXPECTED) {
      const matches = plans.filter(p => p.prop === prop && p.value === value)
      expect(matches).toHaveLength(1)
      for (const plan of matches) {
        expect(plan.system).toBe(SYSTEM)
        expect(plan.when).toEqual([])
        expect(plan.declarations.length).toBeGreaterThan(0)
        for (const decl of plan.declarations) {
          expect(emitted.has(decl.className)).toBe(true)
        }
        expect(plan.declarations.map(d => d.className)).toContain(className)
      }
    }

    const utilities = layerClassNames(result.stylesheet, 'utilities')
    for (const { className } of EXPECTED) {
      expect(utilities).toContain(className)
    }

    const index = createStylePlanIndex(result.runtime)
    for (const { prop, value, className } of EXPECTED) {
      expect(mergeStylePlans(index, [{ system: SYSTEM, prop, value }])).toContain(className)
    }

    // `[42]` folds to its spelling, then rides the ordinary unknown-property
    // path — never UnfoldableKey. Each dynamic key warns once, located.
    expect(result.diagnostics).toHaveLength(3)
    const [numeric, ident, call] = result.diagnostics
    expect(numeric!.severity).toBe('warning')
    expect(numeric!.code).toBe('ATM-W-UNKNOWN-PROPERTY')
    expect(numeric!.message).toMatch(/Unknown style property "42"/)
    expect(numeric!.file).toMatch(/keys\.ts$/)
    expect(numeric!.line).toBe(10)
    for (const [diag, line] of [
      [ident, 14],
      [call, 17],
    ] as const) {
      expect(diag!.severity).toBe('warning')
      expect(diag!.code).toBe('ATM-W-UNFOLDABLE-KEY')
      expect(diag!.message).toMatch(/Dynamic computed property key/)
      expect(diag!.file).toMatch(/keys\.ts$/)
      expect(diag!.line).toBe(line)
      expect(diag!.column).toBe(8)
    }
  },
}

export default spec
