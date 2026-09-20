/**
 * Computed-key station (ATM-SITE-49, SPEC-V2-64 static + folded halves,
 * entry-40 helper-key fold). Static keys (`['color']`, `` [`...`] ``,
 * `[42]`) and single-leaf folded keys (`[k]`, `[t.p]`, `[s[0]]`, `[hov]`
 * conditions, `[gh('cool')]` helper calls, `['col'+'or']` concats)
 * resolve exactly like their bare spellings; multi-leaf and genuinely
 * dynamic keys warn once per member and keep static siblings.
 */
import { expect } from 'vitest'
import { createStylePlanIndex, mergeStylePlans } from '../../../js/index.js'
import {
  compileCase,
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
  { prop: 'padding', value: '12px', className: `${SYSTEM}__p_12px` },
]

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-49',
  async verify(result) {
    for (const { prop, value } of EXPECTED) {
      expect(hasWant(result, prop, value)).toBe(true)
    }
    // The computed `['color']` and the bare control are the same leaf twice;
    // `[k]` adds a third base `color: red`, `[hov]` nests two more under the
    // condition, the entry-40 `[gh('cool')]` key nests one under the
    // group selector, and the entry-64 `['col'+'or']` key adds a fourth
    // base leaf. Nothing mints from refused or numeric keys.
    expect(getWantsForProp(result, 'color')).toHaveLength(7)
    expect(getWantsForProp(result, 'backgroundColor')).toHaveLength(1)
    expect(getWantsForProp(result, 'padding')).toHaveLength(4)
    expect(getWantsForProp(result, 'margin')).toHaveLength(4)
    expect(hasWant(result, 'color', 'red', ['_hover'])).toBe(true)
    expect(hasWant(result, 'color', 'blue', ['_hover'])).toBe(true)
    expect(hasWant(result, 'color', 'red', ['&[data-group="cool"]'])).toBe(true)
    expect(hasWant(result, '42', 'red')).toBe(false)
    expect(hasWant(result, '-4', 'red')).toBe(false)
    expect(result.wants).toHaveLength(16)

    const plans = result.runtime.stylePlans
    // Plans dedupe by leaf: the quadrupled `color: red` want shares one
    // plan; only the refused concat's `padding: 12px` sibling mints new.
    expect(plans).toHaveLength(10)
    const hoverRed = plans.filter(
      p =>
        p.prop === 'color' &&
        p.value === 'red' &&
        p.when.length === 1 &&
        p.when[0] === '_hover'
    )
    expect(hoverRed).toHaveLength(1)
    const hoverBlue = plans.filter(
      p => p.prop === 'color' && p.value === 'blue' && p.when.length === 1
    )
    expect(hoverBlue).toHaveLength(1)
    expect(hoverBlue[0]!.when[0]).toBe('_hover')
    const groupRed = plans.filter(
      p =>
        p.prop === 'color' &&
        p.value === 'red' &&
        p.when.length === 1 &&
        p.when[0] !== '_hover'
    )
    expect(groupRed).toHaveLength(1)
    expect(groupRed[0]!.when[0]).toBe('&[data-group="cool"]')
    const emitted = new Set(Object.values(result.css?.classes ?? {}))
    for (const { prop, value, className } of EXPECTED) {
      const matches = plans.filter(
        p => p.prop === prop && p.value === value && p.when.length === 0
      )
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
      expect(mergeStylePlans(index, [{ system: SYSTEM, prop, value }])).toContain(
        className
      )
    }

    // `[42]` folds to its spelling, then rides the ordinary unknown-property
    // path — never UnfoldableKey. Each dynamic key warns once, located. The
    // three unknown-prop lines stay default (Wave-1b carve-out); the four
    // unfoldable-key lines ride the opt-in channel (S6 E8-class re-point).
    const defaults = result.diagnostics ?? []
    expect(defaults).toHaveLength(3)
    for (const [suffix, line, message] of [
      ['keys.ts', 10, 'Unknown style property "42"'],
      ['folded.ts', 17, 'Unknown style property "42"'],
      ['folded.ts', 19, 'Unknown style property "-4"'],
    ] as const) {
      const diag = defaults.find(
        d => (d.file ?? '').endsWith(suffix) && d.line === line
      )
      expect(diag, `default diagnostic at ${suffix}:${line}`).toBeDefined()
      expect(diag!.severity).toBe('warning')
      expect(diag!.code).toBe('ATM-W-UNKNOWN-PROPERTY')
      expect(diag!.message).toBe(message)
      expect(diag!.column).toBe(8)
    }
    const opted = await compileCase('ATM-SITE-49', { logs: ['compiler'] })
    expect(opted.compilerDiagnostics, 'opt-in channel populates').toBeDefined()
    const channel = opted.compilerDiagnostics ?? []
    const moved = channel.filter(
      d => d.code !== 'ATM-I-EXPECTED-LOOKUP' && d.code !== 'ATM-I-DYNAMIC-SLOT'
    )
    expect(moved).toHaveLength(4)
    const keysDiags = moved.filter(d => d.file?.match(/keys\.ts$/))
    const foldedDiags = moved.filter(d =>
      d.file?.match(/folded\.ts$/)
    )
    expect(keysDiags).toHaveLength(2)
    expect(foldedDiags).toHaveLength(2)
    const [ident, call] = keysDiags
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
    // The multi-leaf key refuses with siblings kept. The entry-40 helper
    // key folds (pinned above) instead of refusing.
    const foldedByLine = new Map(foldedDiags.map(d => [d.line, d]))
    for (const [line, code, pattern] of [
      [24, 'ATM-W-UNFOLDABLE-KEY', /Dynamic computed property key/],
      [34, 'ATM-W-UNFOLDABLE-KEY', /Dynamic computed property key/],
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
