/**
 * Element-access station (ATM-SITE-48, SPEC-V2-63). Reads over const
 * objects, const arrays, and inline literals fold through the shared
 * element node — literal, const-identifier (single- and multi-leaf),
 * member, nested, and optional-chain indices — while an unfoldable index
 * or base, a missing entry, a chained read, and a reassigned table each
 * warn once with the key or side named and keep their static siblings.
 * Holes omit silently. Concat/template indices fold when SITE-33/51 land.
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
]

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-48',
  verify(result) {
    // Every folded read lands its leaf: literal, identifier, multi-leaf,
    // member, nested, inline, and optional-chain indices alike.
    for (const { prop, value } of EXPECTED) {
      expect(hasWant(result, prop, value)).toBe(true)
    }
    expect(hasWant(result, 'color', 'blue', ['_hover'])).toBe(true)
    // Holes omit: no margin want reads the holey slot, the sibling lands.
    expect(getWantsForProp(result, 'color')).toHaveLength(10)
    expect(getWantsForProp(result, 'margin')).toHaveLength(6)
    expect(getWantsForProp(result, 'padding')).toHaveLength(7)
    expect(result.wants).toHaveLength(23)
    expect(hasWant(result, 'color', 'typo')).toBe(false)

    // Plans dedupe by leaf: one plan per distinct (prop, value, when).
    const plans = result.runtime.stylePlans
    expect(plans).toHaveLength(13)
    for (const { prop, value, className } of EXPECTED) {
      const matches = plans.filter(p => p.prop === prop && p.value === value && p.when.length === 0)
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
      expect(mergeStylePlans(index, [{ system: SYSTEM, prop, value }])).toContain(className)
    }

    // Eight refusals, each located at the failing side with the key named.
    const diagnostics = result.diagnostics ?? []
    expect(diagnostics).toHaveLength(8)
    const member = diagnostics.filter(d => d.code === 'ATM-W-DYNAMIC-MEMBER')
    const mutated = diagnostics.filter(d => d.code === 'ATM-W-MUTATED-BINDING')
    expect(member).toHaveLength(7)
    expect(mutated).toHaveLength(1)
    const byLine = new Map(diagnostics.map(d => [d.line, d]))
    const at = (line: number) => {
      const diag = byLine.get(line)
      expect(diag, `diagnostic at refuse.ts:${line}`).toBeDefined()
      return diag!
    }
    // Index refusals point at the index expression itself.
    expect(at(8).column).toBe(21)
    expect(at(8).message).toMatch(/Dynamic non-literal element index 'dk'/)
    expect(at(10).column).toBe(21)
    expect(at(10).message).toMatch(/Dynamic non-literal element index 'pick\(\)'/)
    // Base refusals point at the base; entry refusals at the whole access.
    expect(at(14).column).toBe(14)
    expect(at(14).message).toMatch(/Dynamic non-literal element base 'maybe'/)
    expect(at(17).column).toBe(14)
    expect(at(17).message).toMatch(/Element access 'colors\[typo\]' has no static entry/)
    expect(at(18).column).toBe(15)
    expect(at(18).message).toMatch(/Element access 'sizes\[9\]' has no static entry/)
    // The partial multi-leaf index keeps red and warns typo.
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(at(21).message).toMatch(/Element access 'colors\[typo\]' has no static entry/)
    // Chained reads refuse the outer base; reassigned tables name the write.
    expect(at(24).message).toMatch(/Dynamic non-literal element base 'member expression'/)
    expect(at(29).message).toMatch(/Dynamic mutated binding 'mut'.*reassigned at .*refuse\.ts:28/)
    for (const diag of diagnostics) {
      expect(diag.severity).toBe('warning')
      expect(diag.file).toMatch(/refuse\.ts$/)
      expect(diag.line).toBeDefined()
      expect(diag.column).toBeDefined()
    }
  },
}

export default spec
