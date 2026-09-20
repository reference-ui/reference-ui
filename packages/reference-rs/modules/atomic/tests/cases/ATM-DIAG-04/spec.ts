/**
 * Located-diagnostics station (ATM-DIAG-04, Operation Error Correct Slice 0).
 * RED: every diagnostic must carry file+line+column, but token-resolution
 * warnings still carry no position at all.
 * (S6 E8-class re-point: the dynamic-identifier refusal rides the opt-in
 * compiler channel with its location intact; the resolve passthrough stays
 * default per the O8 R3 adjudication, still located.)
 */
import { expect } from 'vitest'
import { compileCase, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-DIAG-04',
  async verify(result) {
    // The static sibling still extracts beside the two refusals.
    expect(hasWant(result, 'mt', '2r')).toBe(true)

    const diagnostics = result.diagnostics ?? []

    // Opt-in: the refusal is visible on the compiler channel, located.
    const opted = await compileCase('ATM-DIAG-04', { logs: ['compiler'] })
    expect(opted.compilerDiagnostics, 'opt-in channel populates').toBeDefined()
    const channel = opted.compilerDiagnostics ?? []

    // Extract half (green since ATM-DIAG-05): the dynamic identifier on a
    // known line reports that line and column, not just the path.
    const dynamic = channel.find(d =>
      d.message.startsWith(
        "Dynamic non-literal identifier 'depth' encountered for prop 'height'"
      )
    )
    expect(dynamic, 'missing dynamic-identifier warning').toBeDefined()
    expect(dynamic!.code).toBe('ATM-W-DYNAMIC-IDENTIFIER')
    expect(dynamic!.file ?? '').toContain('located.ts')
    expect(dynamic!.line).toBe(4)
    expect(dynamic!.column).toBe(11)

    // Resolve half: the token-resolution warning carries a location on the
    // default channel (resolve passthroughs stay default per O8 R3).
    expect(diagnostics).toHaveLength(1)
    const token = diagnostics.find(d => d.code === 'ATM-W-UNKNOWN-TOKEN-PATH')
    expect(token, 'missing unknown-token-path warning').toBeDefined()
    expect(token!.message).toContain('ui.missing.path')
    expect(token!.file ?? '').toContain('located.ts')
    expect(token!.line).toBeGreaterThan(0)
    expect(token!.column).toBeGreaterThan(0)

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
