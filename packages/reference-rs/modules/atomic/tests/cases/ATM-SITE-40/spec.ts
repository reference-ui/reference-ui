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
  compileCase,
  getWantsForProp,
  harvestWants,
  hasWant,
  layerClassNames,
  siteWants,
  type AtomicCaseSpec,
} from '../../helpers.js'

const SYSTEM = '@reference-ui/lib'
const RED_CLASS = `${SYSTEM}__c_red`

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-40',
  async verify(result) {
    // Aliased scalar, object (spread + member), and array-index reads.
    // Red/blue twin site atoms, so the sink infos a zero count.
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(siteWants(result).filter(w => w.prop === 'color')).toHaveLength(3)
    expect(getWantsForProp(result, 'color')).toHaveLength(3)
    expect(harvestWants(result)).toHaveLength(0)
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
    // merge-bag fallback genuinely misses and the guard stays observable —
    // all on the opt-in channel now (S6 E8-class re-point); default silent.
    expect(result.diagnostics ?? []).toHaveLength(0)
    const opted = await compileCase('ATM-SITE-40', { logs: ['compiler'] })
    expect(opted.compilerDiagnostics, 'opt-in channel populates').toBeDefined()
    const channel = opted.compilerDiagnostics ?? []
    const warnings = channel.filter(d => d.severity === 'warning')
    const infos = channel.filter(d => d.code === 'ATM-I-HARVEST-SINK')
    // The color sink is covered incidentally (every offered value is a
    // static plan, zero net-new): the three identifier refusals and the
    // sink info stay silent on the default, but their facts are visible
    // opt-in beside the spread refusal.
    expect(warnings).toHaveLength(4)
    expect(infos).toHaveLength(1)
    const covered = warnings.filter(d => d.code === 'ATM-W-DYNAMIC-IDENTIFIER')
    expect(covered).toHaveLength(3)
    for (const expected of [
      {
        file: 'cycled.ts',
        line: 7,
        code: 'ATM-W-UNFOLDABLE-SPREAD',
        message: 'Dynamic object spread',
      },
    ]) {
      const match = warnings.find(
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
