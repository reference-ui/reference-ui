/**
 * Unary fold-or-refuse station (ATM-SITE-38, SPEC-V2-09/78, GAP-05b).
 * `-`/`+`/`!`/`~` fold over literal and const-resolved numeric/boolean
 * operands with the operator applied to every leaf; anything else refuses
 * with a located diagnostic and zero wants. TS non-null `!` is transparent
 * in both walkers.
 */
import { expect } from 'vitest'
import {
  compileCase,
  getWantsForProp,
  harvestWants,
  hasWant,
  type AtomicCaseSpec,
} from '../../helpers.js'

const FOLDS: Array<{ prop: string; value: string | number | boolean }> = [
  { prop: 'marginTop', value: -4 },
  { prop: 'order', value: 8 },
  { prop: 'order', value: -2 },
  { prop: 'order', value: false },
  { prop: 'order', value: -4 },
  { prop: 'order', value: -8 },
  { prop: 'order', value: -6 },
  { prop: 'order', value: true },
  { prop: 'order', value: -1 },
  { prop: 'width', value: '2r' },
  { prop: 'padding', value: '4px' },
]

const UNARY_REFUSALS: Array<{ file: string; line: number; op: string; detail: string }> = [
  { file: 'fold.ts', line: 19, op: '-', detail: 'does not apply to a non-numeric value' },
  { file: 'literal.ts', line: 6, op: '-', detail: 'does not apply to a non-numeric value' },
  { file: 'literal.ts', line: 7, op: '!', detail: 'does not apply to a non-numeric value' },
  { file: 'literal.ts', line: 8, op: 'typeof', detail: 'is not foldable' },
  { file: 'literal.ts', line: 9, op: 'delete', detail: 'is not foldable' },
  { file: 'literal.ts', line: 11, op: '~', detail: 'does not apply to a non-numeric value' },
  { file: 'unfoldable.ts', line: 4, op: '-', detail: 'does not fold an array operand' },
  { file: 'unfoldable.ts', line: 5, op: '-', detail: 'does not fold an object operand' },
]

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-38',
  async verify(result) {
    // Every fold emits its wants: 15 across the four inputs. The marginTop
    // sink harvests 2r/4px/auto; `auto` is invalid on `order`, so that sink
    // infos a zero count.
    for (const { prop, value } of FOLDS) {
      expect(hasWant(result, prop, value)).toBe(true)
    }
    expect(harvestWants(result)).toHaveLength(3)
    expect(result.wants ?? []).toHaveLength(18)

    // `!true` folds to `false`, never `true`: the only `true` want is `!0`'s.
    const falses = (result.wants ?? []).filter(
      w => w.prop === 'order' && (w.value as { Bool: boolean }).Bool === false,
    )
    expect(falses).toHaveLength(2)
    const trues = getWantsForProp(result, 'order').filter(
      w => (w.value as { Bool: boolean }).Bool === true,
    )
    expect(trues).toHaveLength(1)
    expect(trues[0]?.file).toContain('literal.ts')
    expect(trues[0]?.line).toBe(5)

    // One runtime plan per unique resolvable leaf: the doubled `-4`/`-8`
    // wants share, and the folded bools are planless exactly like bare bools
    // (ATM-SITE-18: `color={true}` warns and mints nothing, no plan either).
    // The three harvested pairs plan beside the nine site plans.
    const plans = result.runtime.stylePlans
    expect(plans).toHaveLength(12)
    for (const { prop, value } of FOLDS) {
      if (typeof value === 'boolean') {
        expect(plans.some(p => p.prop === prop && p.value === value)).toBe(false)
      } else {
        expect(plans.some(p => p.prop === prop && p.value === value)).toBe(true)
      }
    }

    // GAP-05b: TS non-null `!` is transparent — plain wants, plain plans.
    for (const prop of ['width', 'padding']) {
      const want = (result.wants ?? []).find(w => w.prop === prop)
      expect(want?.important).toBe(false)
      const plan = plans.find(p => p.prop === prop)
      expect(plan?.important).toBe(false)
    }
    expect(result.css?.classes?.['width:2r']).not.toContain('!')
    expect(result.css?.classes?.['padding:4px']).not.toContain('!')

    // Eight unary refusals: zero wants from those positions, one located
    // `ATM-W-DYNAMIC-UNARY` diagnostic each, naming the operator — on the
    // opt-in channel now (S6 E8-class re-point).
    const opted = await compileCase('ATM-SITE-38', { logs: ['compiler'] })
    expect(opted.compilerDiagnostics, 'opt-in channel populates').toBeDefined()
    const diagnostics = opted.compilerDiagnostics ?? []
    for (const { file, line, op, detail } of UNARY_REFUSALS) {
      const match = diagnostics.find(
        d =>
          d.code === 'ATM-W-DYNAMIC-UNARY' &&
          d.file?.endsWith(file) &&
          d.line === line &&
          d.message.includes(`operator '${op}'`) &&
          d.message.includes(detail),
      )
      expect(match, `missing unary refusal for '${op}' in ${file}:${line}`).toBeDefined()
      expect(match!.severity).toBe('warning')
      expect(match!.column).toBeGreaterThan(0)
    }

    // Dynamic operands keep their existing vocabulary.
    const ident = diagnostics.find(d => d.message.includes("'unknownIdent'"))
    expect(ident?.code).toBe('ATM-W-DYNAMIC-IDENTIFIER')
    const member = diagnostics.find(
      d =>
        d.file?.endsWith('unfoldable.ts') &&
        d.line === 9 &&
        d.code !== 'ATM-I-DYNAMIC-SLOT' &&
        d.code !== 'ATM-I-EXPECTED-LOOKUP'
    )
    expect(member?.code).toBe('ATM-W-DYNAMIC-MEMBER')
    const mutated = diagnostics.find(d => d.message.includes("'shade'"))
    expect(mutated?.code).toBe('ATM-W-MUTATED-BINDING')
    expect(mutated?.message).toContain('reassigned at')

    // The three folded bools fail CSS validation at resolve, like bare
    // bools — split by value (F6): the `true` is a genuine runtime miss
    // (runtime queries `true`) and stays default; the two `false` ride the
    // channel (runtime `isHole` skips them).
    const defaults = result.diagnostics ?? []
    expect(defaults).toHaveLength(1)
    expect(defaults[0]!.code).toBe('ATM-W-INVALID-CSS-VALUE')
    expect(defaults[0]!.message).toContain('`true` is not valid CSS')
    const invalid = diagnostics.filter(d => d.code === 'ATM-W-INVALID-CSS-VALUE')
    expect(invalid).toHaveLength(2)
    for (const d of invalid) {
      expect(d.message).toContain('`false` is not valid CSS')
    }

    const warnings = diagnostics.filter(d => d.severity === 'warning')
    const infos = diagnostics.filter(d => d.code === 'ATM-I-HARVEST-SINK')
    expect(warnings).toHaveLength(13)
    expect(infos).toHaveLength(2)
    for (const d of infos) {
      expect(d.code).toBe('ATM-I-HARVEST-SINK')
    }

    expect(result.stylesheet).toContain('margin-top: -4px;')
    expect(result.stylesheet).toContain('order: 8;')
    expect(result.stylesheet).toContain('order: -2;')
    expect(result.stylesheet).toContain('order: -6;')
    expect(result.stylesheet).toContain('order: -1;')
    expect(result.stylesheet).toContain('padding: 4px;')
    expect(result.stylesheet).not.toContain('color: red')
  },
}

export default spec
