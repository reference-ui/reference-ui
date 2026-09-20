/**
 * Unicode-positions station (ATM-DIAG-06, Operation Error Correct Slice 0).
 * RED: columns must count UTF-16 code units and the global-surface
 * diagnostic must carry a location. No panic on non-ASCII source.
 * (S6 E8-class re-point: the dynamic-identifier refusal rides the opt-in
 * compiler channel with its UTF-16 column intact; the global-surface line
 * stays default per the O8 R3 adjudication, still located.)
 */
import { expect } from 'vitest'
import { compileCase, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-DIAG-06',
  async verify(result) {
    // No panic, correct extraction: the static sibling extracts and the
    // CJK/accented global selector paints.
    expect(hasWant(result, 'mt', '2r')).toBe(true)
    expect(result.stylesheet).toContain('日本語')
    expect(result.stylesheet).toContain('café')

    const diagnostics = result.diagnostics ?? []

    // Opt-in: the refusal is visible on the compiler channel, located.
    const opted = await compileCase('ATM-DIAG-06', { logs: ['compiler'] })
    expect(opted.compilerDiagnostics, 'opt-in channel populates').toBeDefined()
    const channel = opted.compilerDiagnostics ?? []

    // Extract half: the dynamic identifier sits past an emoji on line 3, so
    // its column pins the unit — UTF-16 61, scalar 60, bytes 63.
    const dynamic = channel.find(d =>
      d.message.startsWith(
        "Dynamic non-literal identifier 'depth' encountered for prop 'color'"
      )
    )
    expect(dynamic, 'missing dynamic-identifier warning').toBeDefined()
    expect(dynamic!.file ?? '').toContain('emoji.ts')
    expect(dynamic!.line).toBe(3)
    expect(dynamic!.column).toBe(61)

    // Global half: the unknown global condition carries a location on the
    // default channel (global-surface lines stay default per O8 R3).
    expect(diagnostics).toHaveLength(1)
    const global = diagnostics.find(
      d => d.code === 'ATM-W-UNKNOWN-CONDITION' && d.message.includes('_bogus')
    )
    expect(global, 'missing unknown-global-condition warning').toBeDefined()
    expect(global!.file).toBeDefined()
    expect(global!.line).toBeGreaterThan(0)
    expect(global!.column).toBeGreaterThan(0)

    // The general claim: no diagnostic without a position, on either
    // channel (analysis telemetry excluded — positioned separately).
    const moved = channel.filter(
      d => d.code !== 'ATM-I-EXPECTED-LOOKUP' && d.code !== 'ATM-I-DYNAMIC-SLOT'
    )
    for (const d of [...diagnostics, ...moved]) {
      expect(d.file ?? '', `${d.code} carries a file`).toBeTruthy()
      expect(d.line ?? 0, `${d.code} carries a line`).toBeGreaterThan(0)
      expect(d.column ?? 0, `${d.code} carries a column`).toBeGreaterThan(0)
    }
  },
}

export default spec
