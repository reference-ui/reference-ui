/**
 * Computed-key station (ATM-SITE-49, SPEC-V2-64 static + folded halves,
 * entry-40 helper-key fold). Static keys (`['color']`, `` [`...`] ``,
 * `[42]`) and single-leaf folded keys (`[k]`, `[t.p]`, `[s[0]]`, `[hov]`
 * conditions, `[gh('cool')]` helper calls) resolve exactly like their bare
 * spellings; multi-leaf and genuinely dynamic keys warn once per member
 * and keep static siblings. Concat keys fold when SITE-33 lands the
 * binary node.
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
  { prop: 'padding', value: '8px', className: `${SYSTEM}__p_8px` },
  { prop: 'margin', value: '8px', className: `${SYSTEM}__m_8px` },
]

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-49',
  verify(result) {
    for (const { prop, value } of EXPECTED) {
      expect(hasWant(result, prop, value)).toBe(true)
    }
    // The computed `['color']` and the bare control are the same leaf twice;
    // `[k]` adds a third base `color: red`, `[hov]` nests two more under the
    // condition, and the entry-40 `[gh('cool')]` key nests one under the
    // group selector. Nothing mints from refused or numeric keys.
    expect(getWantsForProp(result, 'color')).toHaveLength(6)
    expect(getWantsForProp(result, 'backgroundColor')).toHaveLength(1)
    expect(getWantsForProp(result, 'padding')).toHaveLength(3)
    expect(getWantsForProp(result, 'margin')).toHaveLength(3)
    expect(hasWant(result, 'color', 'red', ['_hover'])).toBe(true)
    expect(hasWant(result, 'color', 'blue', ['_hover'])).toBe(true)
    expect(hasWant(result, 'color', 'red', ['&[data-group="cool"]'])).toBe(true)
    expect(hasWant(result, '42', 'red')).toBe(false)
    expect(hasWant(result, '-4', 'red')).toBe(false)
    expect(result.wants).toHaveLength(13)

    const plans = result.runtime.stylePlans
    // Plans dedupe by leaf: the tripled `color: red` want shares one plan.
    expect(plans).toHaveLength(9)
    const hoverRed = plans.filter(
      p => p.prop === 'color' && p.value === 'red' && p.when.length === 1 && p.when[0] === '_hover',
    )
    expect(hoverRed).toHaveLength(1)
    const hoverBlue = plans.filter(
      p => p.prop === 'color' && p.value === 'blue' && p.when.length === 1,
    )
    expect(hoverBlue).toHaveLength(1)
    expect(hoverBlue[0]!.when[0]).toBe('_hover')
    const groupRed = plans.filter(
      p => p.prop === 'color' && p.value === 'red' && p.when.length === 1 && p.when[0] !== '_hover',
    )
    expect(groupRed).toHaveLength(1)
    expect(groupRed[0]!.when[0]).toBe('&[data-group="cool"]')
    const emitted = new Set(Object.values(result.css?.classes ?? {}))
    for (const { prop, value, className } of EXPECTED) {
      const matches = plans.filter(p => p.prop === prop && p.value === value && p.when.length === 0)
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
    // The entry-40 helper key mints a real group-selector rule.
    expect(result.stylesheet).toContain('[data-group="cool"] { color: red; }')

    const index = createStylePlanIndex(result.runtime)
    for (const { prop, value, className } of EXPECTED) {
      expect(mergeStylePlans(index, [{ system: SYSTEM, prop, value }])).toContain(className)
    }

    // `[42]` folds to its spelling, then rides the ordinary unknown-property
    // path — never UnfoldableKey. Each dynamic key warns once, located.
    expect(result.diagnostics).toHaveLength(6)
    const keysDiags = (result.diagnostics ?? []).filter(d => d.file?.match(/keys\.ts$/))
    const foldedDiags = (result.diagnostics ?? []).filter(d =>
      d.file?.match(/folded\.ts$/),
    )
    expect(keysDiags).toHaveLength(3)
    expect(foldedDiags).toHaveLength(3)
    const [numeric, ident, call] = keysDiags
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
    // Folded numerics ride the unknown-property path; the multi-leaf key
    // refuses with siblings kept. The entry-40 helper key folds (pinned
    // above) instead of refusing.
    const foldedByLine = new Map(foldedDiags.map(d => [d.line, d]))
    for (const [line, code, pattern] of [
      [17, 'ATM-W-UNKNOWN-PROPERTY', /Unknown style property "42"/],
      [19, 'ATM-W-UNKNOWN-PROPERTY', /Unknown style property "-4"/],
      [24, 'ATM-W-UNFOLDABLE-KEY', /Dynamic computed property key/],
    ] as const) {
      const diag = foldedByLine.get(line)
      expect(diag, `diagnostic at folded.ts:${line}`).toBeDefined()
      expect(diag!.severity).toBe('warning')
      expect(diag!.code).toBe(code)
      expect(diag!.message).toMatch(pattern)
      expect(diag!.column).toBe(8)
    }
  },
}

export default spec
