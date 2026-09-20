/**
 * Imported-conditional station (ATM-SITE-77, Overmatch Ph3 fold-side of
 * SPEC-V2-55). Branching leaves in const-object inits fan out on spread
 * and member read, imported and same-file alike; props with no static
 * value diagnose with the prop named.
 */
import { expect } from 'vitest'
import { compileCase, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const EXPECTED_WANTS: Array<{ prop: string; value: string }> = [
  { prop: 'color', value: 'red' },
  { prop: 'color', value: 'blue' },
  { prop: 'color', value: 'cyan' },
  { prop: 'color', value: 'magenta' },
  { prop: 'color', value: 'plum' },
  { prop: 'padding', value: '4px' },
  { prop: 'color', value: 'white' },
  { prop: 'margin', value: '1r' },
  { prop: 'color', value: 'pink' },
]

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-77',
  async verify(result) {
    for (const { prop, value } of EXPECTED_WANTS) {
      expect(hasWant(result, prop, value)).toBe(true)
    }
    // Spread and member twins arrive twice each (imported + same-file,
    // branch + member); the static padding sibling and the partial white
    // arm arrive once per position. The six residue arms each add one
    // want; the mixed union adds one, the combo union two, and the two
    // granularity controls one each. The Ph4 binding arms add eleven:
    // five aliased (theme spread/member twins plus the fb spread), five
    // through the barrel (cond and fb spreads plus the partial spread and
    // member), and the cycled file's surviving padding sibling.
    expect(result.wants ?? []).toHaveLength(34)

    // One runtime plan per unique leaf, plus the base-conditioned red.
    const plans = result.stylePlans
    expect(plans).toHaveLength(EXPECTED_WANTS.length + 1)
    for (const { prop, value } of EXPECTED_WANTS) {
      expect(plans.some(p => p.prop === prop && p.value === value)).toBe(true)
    }

    // The dynamic prop and the both-dynamic prop diagnose; static
    // siblings and the partial white arm survive — all on the opt-in
    // channel now (S6 E8-class re-point); the default is silent.
    expect(result.diagnostics ?? []).toHaveLength(0)
    const opted = await compileCase('ATM-SITE-77', { logs: ['compiler'] })
    expect(opted.compilerDiagnostics, 'opt-in channel populates').toBeDefined()
    const diagnostics = (opted.compilerDiagnostics ?? []).filter(
      d => d.severity === 'warning'
    )
    expect(diagnostics).toHaveLength(19)
    for (const expected of [
      { line: 21, message: "property 'color' of 'dyn' has no static style value" },
      { line: 24, message: "property 'color' of 'both' has no static style value" },
    ]) {
      const match = diagnostics.find(
        d => d.file?.endsWith('app.ts') && d.line === expected.line && d.message === expected.message,
      )
      expect(match, `missing app.ts:${expected.line} ${expected.message}`).toBeDefined()
      expect(match!.severity).toBe('warning')
      expect(match!.code).toBe('ATM-W-UNFOLDABLE-OBJECT-PROP')
      expect(match!.column).toBeDefined()
    }
    // Ph4 residue channel: every use of a partially static entry keeps the
    // static leaves and diagnoses the dropped arm (the Ph3 silence pin,
    // flipped — the collector now flags the loss at collect time).
    for (const expected of [
      {
        line: 17,
        message: "property 'color' of 'fallback' drops a dynamic arm with no static style value",
      },
      { line: 22, message: "property 'color' of 'part' drops a dynamic arm with no static style value" },
      { line: 23, message: "property 'part.color' drops a dynamic arm with no static style value" },
      { line: 33, message: "property 'color' of 'apart' drops a dynamic arm with no static style value" },
      {
        line: 34,
        message:
          "Element access 'part['color']' drops a dynamic arm with no static style value for prop 'color'",
      },
      { line: 35, message: "property 'keys.k' drops a dynamic arm with no static style value" },
      { line: 36, message: "property 'part.color' drops a dynamic arm with no static style value" },
      { line: 37, message: "call to 'getPart' drops a dynamic arm with no static style value" },
      {
        line: 38,
        message: "property 'deep.nested.color' drops a dynamic arm with no static style value",
      },
      { line: 43, message: "property 'color' of 'mix' drops a dynamic arm with no static style value" },
      {
        line: 44,
        message: "property 'color' of 'combo' drops a dynamic arm with no static style value",
      },
      { line: 50, message: "call to 'getC' drops a dynamic arm with no static style value" },
    ]) {
      const match = diagnostics.find(
        d => d.file?.endsWith('app.ts') && d.line === expected.line && d.message === expected.message,
      )
      expect(match, `missing app.ts:${expected.line} ${expected.message}`).toBeDefined()
      expect(match!.severity).toBe('warning')
      expect(match!.code).toBe('ATM-W-PARTIAL-OBJECT-PROP')
      expect(match!.column).toBeDefined()
    }
    // Leaf semantics: a key over a clean entry of a dirty object stays
    // silent (the fence still taints whole-object captures — line 50).
    expect(diagnostics.some(d => d.file?.endsWith('app.ts') && d.line === 49)).toBe(false)

    // Ph4 binding remainder (crew B): aliased imports of the conditional
    // objects fan out exactly like the plain instance; barrel re-exports
    // (including the aliased `fb` and `partial` hops) resolve by binding
    // with the residue flag riding the walk; the re-export cycle guards
    // to a spread warning with its sibling kept.
    expect(hasWant(result, 'color', 'red')).toBe(true)
    for (const expected of [
      {
        file: 'alias.ts',
        line: 7,
        code: 'ATM-W-PARTIAL-OBJECT-PROP',
        message: "property 'color' of 'fb' drops a dynamic arm with no static style value",
      },
      {
        file: 'via-barrel.ts',
        line: 7,
        code: 'ATM-W-PARTIAL-OBJECT-PROP',
        message: "property 'color' of 'fb' drops a dynamic arm with no static style value",
      },
      {
        file: 'via-barrel.ts',
        line: 8,
        code: 'ATM-W-PARTIAL-OBJECT-PROP',
        message: "property 'color' of 'partial' drops a dynamic arm with no static style value",
      },
      {
        file: 'via-barrel.ts',
        line: 9,
        code: 'ATM-W-PARTIAL-OBJECT-PROP',
        message: "property 'partial.color' drops a dynamic arm with no static style value",
      },
      {
        file: 'cycled.ts',
        line: 6,
        code: 'ATM-W-UNFOLDABLE-SPREAD',
        message: 'Dynamic object spread',
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
    // The aliased and barrel spreads of the clean conditional stay silent.
    for (const [file, line] of [
      ['alias.ts', 6],
      ['alias.ts', 8],
      ['via-barrel.ts', 6],
    ] as const) {
      expect(diagnostics.some(d => d.file?.endsWith(file) && d.line === line)).toBe(false)
    }

    expect(result.stylesheet).toContain('color: red;')
    expect(result.stylesheet).toContain('color: blue;')
    expect(result.stylesheet).toContain('color: cyan;')
    expect(result.stylesheet).toContain('color: magenta;')
    expect(result.stylesheet).toContain('padding: 4px;')
  },
}

export default spec
