/**
 * Diagnostic-precision station (ATM-DIAG-05, Overmatch Ph1, SPEC-V2-77).
 * Every extract refusal carries file:line:col of the offending node plus a
 * stable code; the same authored mistake always reports the same code.
 * (S6 E8-class re-point: all eleven refusals + five sink infos ride the
 * opt-in compiler channel with positions intact; the default is silent.
 * Wave-1b carve-out: the unknown-prop refusal stays default — it names an
 * exact queried-and-missed runtime key — while the other ten refusals +
 * five sink infos stay channel-only.)
 */
import { expect } from 'vitest'
import { compileCase, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const EXPECTED: Array<{
  line: number
  column: number
  code: string
  message: string
}> = [
  {
    line: 4,
    column: 10,
    code: 'ATM-W-DYNAMIC-EXPRESSION',
    message: "Dynamic non-literal expression encountered for prop 'color'",
  },
  {
    line: 5,
    column: 10,
    code: 'ATM-W-DYNAMIC-MEMBER',
    message: "Dynamic non-literal expression encountered for prop 'width'",
  },
  {
    line: 6,
    column: 11,
    code: 'ATM-W-DYNAMIC-IDENTIFIER',
    message: "Dynamic non-literal identifier 'depth' encountered for prop 'height'",
  },
  {
    line: 7,
    column: 12,
    code: 'ATM-W-DYNAMIC-IDENTIFIER',
    message: "Dynamic non-literal identifier 'depth' encountered for prop 'padding'",
  },
  {
    line: 8,
    column: 14,
    code: 'ATM-W-DYNAMIC-TEMPLATE',
    message:
      "Dynamic non-literal template part 1 (identifier 'gap') encountered for prop 'margin'",
  },
  {
    line: 9,
    column: 4,
    code: 'ATM-W-UNFOLDABLE-KEY',
    message: 'Dynamic computed property key encountered in style object',
  },
  {
    line: 10,
    column: 3,
    code: 'ATM-W-UNKNOWN-PROPERTY',
    message: 'Unknown style property "frobnicate"',
  },
  {
    line: 11,
    column: 6,
    code: 'ATM-W-UNFOLDABLE-SPREAD',
    message:
      'Dynamic object spread encountered in style object; keeping sibling properties',
  },
  {
    line: 12,
    column: 11,
    code: 'ATM-W-NON-OBJECT-CONDITION',
    message: 'Condition block expected object expression',
  },
  {
    line: 13,
    column: 8,
    code: 'ATM-W-UNKNOWN-BREAKPOINT',
    message: 'Unknown breakpoint name in r prop: "wat"',
  },
  {
    line: 19,
    column: 36,
    code: 'ATM-W-MUTATED-BINDING',
    message: "Dynamic mutated binding 'tint' encountered for prop 'color'",
  },
]

const spec: AtomicCaseSpec = {
  id: 'ATM-DIAG-05',
  async verify(result) {
    // The static sibling still extracts beside eleven refusals.
    expect(hasWant(result, 'mt', '2r')).toBe(true)
    expect(result.stylesheet).toContain('margin-top:')

    // The unknown-prop refusal names an exact queried-and-missed runtime
    // key, so it stays default (Wave-1b carve-out); the other ten refusals
    // prove no exact miss and ride the opt-in channel.
    const defaults = result.diagnostics ?? []
    expect(defaults).toHaveLength(1)
    expect(defaults[0]).toMatchObject({
      severity: 'warning',
      code: 'ATM-W-UNKNOWN-PROPERTY',
      message: 'Unknown style property "frobnicate"',
      line: 10,
      column: 3,
    })
    expect(defaults[0]!.file ?? '').toContain('precise.ts')

    // Opt-in: the other ten refusals + five sink infos, positioned.
    const opted = await compileCase('ATM-DIAG-05', { logs: ['compiler'] })
    expect(opted.compilerDiagnostics, 'opt-in channel populates').toBeDefined()
    const moved = (opted.compilerDiagnostics ?? []).filter(
      d => d.code !== 'ATM-I-EXPECTED-LOOKUP' && d.code !== 'ATM-I-DYNAMIC-SLOT'
    )
    const warnings = moved.filter(d => d.severity === 'warning')
    const infos = moved.filter(d => d.severity === 'info')
    const channelled = EXPECTED.filter(
      d => d.code !== 'ATM-W-UNKNOWN-PROPERTY'
    )
    expect(warnings).toHaveLength(channelled.length)
    expect(
      warnings.filter(d => d.code === 'ATM-W-UNKNOWN-PROPERTY')
    ).toHaveLength(0)
    for (const d of moved) {
      expect(d.file ?? '').toContain('precise.ts')
      expect(d.line).toBeGreaterThan(0)
      expect(d.column).toBeGreaterThan(0)
    }
    for (const d of warnings) {
      expect(d.code).toMatch(/^ATM-W-/)
    }
    // Five refused positions sink; every info locates its sink site.
    expect(infos).toHaveLength(5)
    for (const d of infos) {
      expect(d.code).toBe('ATM-I-HARVEST-SINK')
    }

    // Each channelled refusal lands on its sub-expression with its class
    // code. The mutated-binding message carries its write site, so match by
    // prefix.
    for (const { line, column, code, message } of channelled) {
      const match = warnings.find(
        d => d.message.startsWith(message) && d.line === line && d.column === column
      )
      expect(match, `missing ${code} at ${line}:${column}`).toBeDefined()
      expect(match!.code).toBe(code)
    }

    // Same authored mistake, same code: both `depth` uses agree.
    const depthDiags = warnings.filter(d => d.message.includes("'depth'"))
    expect(depthDiags).toHaveLength(2)
    expect(depthDiags[0]!.code).toBe(depthDiags[1]!.code)
  },
}

export default spec
