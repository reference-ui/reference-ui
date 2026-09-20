/**
 * Binary fold-bundle station (ATM-SITE-33, SPEC-V2-10/11/12/19, SPEC-V2-66
 * fold half). Arithmetic, string concat, comparison, and all-literal
 * short-circuit fold over literal and const-resolved operands; folded
 * ternary tests compile the live arm only and name the dead arm in an
 * info. Refusals diagnose with a code and keep every static sibling.
 */
import { expect } from 'vitest'
import { compileCase, getWantsForProp, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const FOLDS: Array<{ prop: string; value: string | number | boolean; when?: string[] }> =
  [
    { prop: 'order', value: 5 },
    { prop: 'order', value: 8 },
    { prop: 'order', value: 4 },
    { prop: 'order', value: 1 },
    { prop: 'order', value: 6 },
    { prop: 'order', value: 10 },
    { prop: 'width', value: '1px' },
    { prop: 'width', value: '4px' },
    { prop: 'width', value: '50%' },
    { prop: 'width', value: '2px' },
    { prop: 'border', value: '8px solid' },
    { prop: 'color', value: 'red' },
    { prop: 'color', value: 'blue' },
    { prop: 'color', value: 'white' },
    { prop: 'color', value: 'black' },
    { prop: 'color', value: 'teal' },
    { prop: 'color', value: 'coral' },
    { prop: 'color', value: 'navy' },
    { prop: 'color', value: 'red', when: ['_hover'] },
    { prop: 'zIndex', value: true },
    { prop: 'zIndex', value: false },
    { prop: 'zIndex', value: true },
    { prop: 'zIndex', value: true },
    { prop: 'zIndex', value: true },
    { prop: 'padding', value: '2' },
    { prop: 'margin', value: '1' },
    { prop: 'margin', value: '1r' },
    { prop: 'margin', value: '2r' },
    { prop: 'margin', value: '3r' },
    { prop: 'margin', value: '4r' },
    { prop: 'margin', value: '5r' },
    { prop: 'margin', value: '6r' },
    { prop: 'bg', value: 'black' },
    { prop: 'order', value: 0 },
  ]

const BINARY_REFUSALS: Array<{ file: string; line: number; op: string; detail: string }> =
  [
    { file: 'refuse.ts', line: 7, op: '/', detail: 'does not fold to a finite value' },
    {
      file: 'refuse.ts',
      line: 8,
      op: '-',
      detail: 'does not apply to a non-numeric value',
    },
    { file: 'refuse.ts', line: 10, op: '|', detail: 'is not foldable' },
    { file: 'refuse.ts', line: 11, op: '/', detail: 'does not fold to a finite value' },
  ]

const DEAD_ARMS: Array<{ file: string; line: number; arm: string; test: string }> = [
  { file: 'compare.ts', line: 5, arm: "'blue'", test: 'true' },
  { file: 'compare.ts', line: 6, arm: "'red'", test: 'false' },
  { file: 'compare.ts', line: 7, arm: "'blue'", test: 'true' },
  { file: 'compare.ts', line: 8, arm: "'red'", test: 'false' },
  { file: 'compare.ts', line: 9, arm: "'blue'", test: 'true' },
  { file: 'compare.ts', line: 10, arm: "'red'", test: 'false' },
  { file: 'deadarm.ts', line: 6, arm: "'black'", test: 'true' },
  { file: 'deadarm.ts', line: 7, arm: "'blue'", test: 'true' },
  { file: 'deadarm.ts', line: 8, arm: "'blue'", test: 'true' },
  { file: 'deadarm.ts', line: 9, arm: "'red'", test: 'false' },
  { file: 'deadarm.ts', line: 10, arm: 'object', test: 'false' },
  { file: 'deadarm.ts', line: 11, arm: 'object', test: 'true' },
  { file: 'deadarm.ts', line: 12, arm: 'object', test: 'true' },
  { file: 'deadarm.ts', line: 13, arm: "'red'", test: 'false' },
  { file: 'flat.tsx', line: 10, arm: "'white'", test: 'true' },
]

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-33',
  async verify(result) {
    // Every fold emits its wants: 51 across the six inputs (48 + the
    // <= / !== / ident-operand tail in compare.ts).
    for (const { prop, value, when } of FOLDS) {
      expect(hasWant(result, prop, value, when ?? [])).toBe(true)
    }
    expect(result.wants ?? []).toHaveLength(51)

    // Dead operands compile nothing: the unpicked logical sides and the
    // dead ternary arms never mint wants.
    for (const dead of ['x', 'second', 'unused', '']) {
      expect(hasWant(result, 'color', dead)).toBe(false)
    }
    expect(hasWant(result, 'order', 9)).toBe(false)
    expect(getWantsForProp(result, 'order')).toHaveLength(10)

    // One runtime plan per unique plannable leaf: folded bools are
    // planless exactly like bare bools, duplicates share.
    const plans = result.stylePlans
    for (const { prop, value, when } of FOLDS) {
      if (typeof value === 'boolean') {
        expect(plans.some(p => p.prop === prop && p.value === value)).toBe(false)
      } else {
        expect(
          plans.some(
            p =>
              p.prop === prop &&
              p.value === value &&
              JSON.stringify(p.when ?? []) === JSON.stringify(when ?? [])
          )
        ).toBe(true)
      }
    }

    // Four binary refusals: zero wants from those positions, one located
    // `ATM-W-DYNAMIC-BINARY` diagnostic each, naming the operator — on the
    // opt-in channel now (S6 E8-class re-point).
    const opted = await compileCase('ATM-SITE-33', { logs: ['compiler'] })
    expect(opted.compilerDiagnostics, 'opt-in channel populates').toBeDefined()
    const diagnostics = opted.compilerDiagnostics ?? []
    for (const { file, line, op, detail } of BINARY_REFUSALS) {
      const match = diagnostics.find(
        d =>
          d.code === 'ATM-W-DYNAMIC-BINARY' &&
          d.file?.endsWith(file) &&
          d.line === line &&
          d.message.includes(`operator '${op}'`) &&
          d.message.includes(detail)
      )
      expect(match, `missing binary refusal for '${op}' in ${file}:${line}`).toBeDefined()
      expect(match!.severity).toBe('warning')
      expect(match!.column).toBeGreaterThan(0)
    }

    // The dynamic operand keeps its existing vocabulary (analysis
    // telemetry at the same site excluded — it shares file+line).
    const dynamic = diagnostics.find(
      d =>
        d.file?.endsWith('refuse.ts') &&
        d.line === 9 &&
        d.code !== 'ATM-I-DYNAMIC-SLOT' &&
        d.code !== 'ATM-I-EXPECTED-LOOKUP'
    )
    expect(dynamic?.code).toBe('ATM-W-DYNAMIC-EXPRESSION')

    // Fifteen dead arms: one located `ATM-I-DEAD-BRANCH` info each,
    // naming the arm and the folded test value.
    for (const { file, line, arm, test } of DEAD_ARMS) {
      const match = diagnostics.find(
        d =>
          d.code === 'ATM-I-DEAD-BRANCH' &&
          d.file?.endsWith(file) &&
          d.line === line &&
          d.message.includes(`dead branch ${arm}`) &&
          d.message.includes(`test folds to ${test}`)
      )
      expect(match, `missing dead-arm info in ${file}:${line}`).toBeDefined()
      expect(match!.severity).toBe('info')
      expect(match!.column).toBeGreaterThan(0)
    }

    // R7 true/false split (F6): the four folded-`true` zIndex refusals are
    // genuine runtime misses (runtime queries `true`) and stay default;
    // the `false` refusal rides the channel (runtime `isHole` skips it).
    const defaults = result.diagnostics ?? []
    expect(defaults).toHaveLength(4)
    for (const d of defaults) {
      expect(d.code).toBe('ATM-W-INVALID-CSS-VALUE')
      expect(d.message).toContain('`true` is not valid CSS')
    }
    const channelFalse = diagnostics.filter(
      d => d.code === 'ATM-W-INVALID-CSS-VALUE'
    )
    expect(channelFalse).toHaveLength(1)
    expect(channelFalse[0]!.message).toContain('`false` is not valid CSS')

    expect(result.stylesheet).toContain('order: 5;')
    expect(result.stylesheet).toContain('order: 10;')
    expect(result.stylesheet).toContain('width: 1px;')
    expect(result.stylesheet).toContain('width: 50%;')
    expect(result.stylesheet).toContain('border-width: 8px;')
    expect(result.stylesheet).toContain('border-style: solid;')
    expect(result.stylesheet).toContain('color: coral;')
  },
}

export default spec
