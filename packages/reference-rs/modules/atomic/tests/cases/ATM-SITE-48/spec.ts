/**
 * Element-access station (ATM-SITE-48, SPEC-V2-63). Reads over const
 * objects, const arrays, and inline literals fold through the shared
 * element node — literal, const-identifier (single- and multi-leaf),
 * member, nested, optional-chain, concat, and interpolated-template
 * indices — while an unfoldable index or base, a missing entry, a
 * scalar-chained read, and a reassigned table each warn once with the key
 * or side named and keep their static siblings. Holes omit silently.
 * Chains over nested entries resolve inside out (entry 63).
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

const EXPECTED: Array<{ prop: string; value: string; className: string }> = [
  { prop: 'color', value: 'red', className: `${SYSTEM}__c_red` },
  { prop: 'color', value: 'blue', className: `${SYSTEM}__c_blue` },
  { prop: 'margin', value: '8px', className: `${SYSTEM}__m_8px` },
  { prop: 'margin', value: '4px', className: `${SYSTEM}__m_4px` },
  { prop: 'margin', value: '12px', className: `${SYSTEM}__m_12px` },
  { prop: 'padding', value: '2px', className: `${SYSTEM}__p_2px` },
  { prop: 'padding', value: '4px', className: `${SYSTEM}__p_4px` },
  { prop: 'padding', value: '8px', className: `${SYSTEM}__p_8px` },
  { prop: 'padding', value: '12px', className: `${SYSTEM}__p_12px` },
  { prop: 'padding', value: '16px', className: `${SYSTEM}__p_16px` },
  { prop: 'padding', value: '20px', className: `${SYSTEM}__p_20px` },
  { prop: 'padding', value: '24px', className: `${SYSTEM}__p_24px` },
  { prop: 'padding', value: '28px', className: `${SYSTEM}__p_28px` },
  { prop: 'padding', value: '32px', className: `${SYSTEM}__p_32px` },
  { prop: 'padding', value: '36px', className: `${SYSTEM}__p_36px` },
]

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-48',
  async verify(result) {
    // Every folded read lands its leaf: literal, identifier, multi-leaf,
    // member, nested, inline, and optional-chain indices alike.
    for (const { prop, value } of EXPECTED) {
      expect(hasWant(result, prop, value)).toBe(true)
    }
    expect(hasWant(result, 'color', 'blue', ['_hover'])).toBe(true)
    // Holes omit: no margin want reads the holey slot, the sibling lands.
    // The margin sink harvests nine net-new pool lengths; red/blue twin
    // site atoms, so the color sink infos zero.
    const site = siteWants(result)
    expect(site.filter(w => w.prop === 'color')).toHaveLength(16)
    expect(getWantsForProp(result, 'color')).toHaveLength(16)
    expect(site.filter(w => w.prop === 'margin')).toHaveLength(6)
    expect(getWantsForProp(result, 'margin')).toHaveLength(15)
    expect(getWantsForProp(result, 'padding')).toHaveLength(10)
    expect(harvestWants(result)).toHaveLength(9)
    expect(result.wants).toHaveLength(41)
    expect(hasWant(result, 'color', 'typo')).toBe(false)

    // Plans dedupe by leaf: one plan per distinct (prop, value, when).
    const plans = result.runtime.stylePlans
    expect(plans).toHaveLength(25)
    for (const { prop, value, className } of EXPECTED) {
      const matches = plans.filter(
        p => p.prop === prop && p.value === value && p.when.length === 0
      )
      expect(matches).toHaveLength(1)
      expect(matches[0]!.declarations.map(d => d.className)).toContain(className)
    }
    const hover = plans.filter(p => p.prop === 'color' && p.value === 'blue')
    expect(hover).toHaveLength(2)
    expect(hover.some(p => p.when.length === 1 && p.when[0] === '_hover')).toBe(true)

    const utilities = layerClassNames(result.stylesheet, 'utilities')
    for (const { className } of EXPECTED) {
      expect(utilities).toContain(className)
    }

    const index = createStylePlanIndex(result.runtime)
    for (const { prop, value, className } of EXPECTED) {
      expect(mergeStylePlans(index, [{ system: SYSTEM, prop, value }])).toContain(
        className
      )
    }

    // Eleven refusals, each located at the failing side with the key named —
    // on the opt-in channel now (S6 E8-class re-point); the default is silent.
    expect(result.diagnostics ?? []).toHaveLength(0)
    const opted = await compileCase('ATM-SITE-48', { logs: ['compiler'] })
    expect(opted.compilerDiagnostics, 'opt-in channel populates').toBeDefined()
    const channel = opted.compilerDiagnostics ?? []
    const warnings = channel.filter(d => d.severity === 'warning')
    const infos = channel.filter(d => d.code === 'ATM-I-HARVEST-SINK')
    // The color sink is covered incidentally (every offered value is a
    // static plan, zero net-new): silent on the default, but its nine
    // member refusals and sink info are visible opt-in beside the
    // uncovered margin pair and the mutated binding (no sink by design).
    expect(warnings).toHaveLength(11)
    expect(infos).toHaveLength(2)
    for (const d of infos) {
      expect(d.code).toBe('ATM-I-HARVEST-SINK')
      expect(d.file).toMatch(/refuse\.ts$/)
    }
    expect(infos.some(d => d.message.match(/margin under \[\]/))).toBe(true)
    expect(infos.some(d => d.message.match(/color under \[\]/))).toBe(true)
    const member = warnings.filter(d => d.code === 'ATM-W-DYNAMIC-MEMBER')
    const mutated = warnings.filter(d => d.code === 'ATM-W-MUTATED-BINDING')
    expect(member).toHaveLength(10)
    expect(mutated).toHaveLength(1)
    const byLine = new Map(warnings.map(d => [d.line, d]))
    const at = (line: number) => {
      const diag = byLine.get(line)
      expect(diag, `diagnostic at refuse.ts:${line}`).toBeDefined()
      return diag!
    }
    // Entry refusals point at the whole access.
    expect(at(18).column).toBe(15)
    expect(at(18).message).toMatch(/Element access 'sizes\[9\]' has no static entry/)
    // The partial multi-leaf index keeps red.
    expect(hasWant(result, 'color', 'red')).toBe(true)
    // Reassigned tables name the write.
    expect(at(29).message).toMatch(
      /Dynamic mutated binding 'mut'.*reassigned at .*refuse\.ts:28/
    )
    for (const diag of warnings) {
      expect(diag.file).toMatch(/refuse\.ts$/)
      expect(diag.line).toBeDefined()
      expect(diag.column).toBeDefined()
    }
  },
}

export default spec
