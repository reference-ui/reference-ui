/**
 * Unknown-values station (ATM-DIAG-11, Operation Error Correct, Slice 5).
 * RED: identifiers, members, `${n}px` / `${color}` templates, calls, `a+b`
 * binaries, and spreads never become userspace warnings — refusal without
 * an exact expected lookup proves no runtime miss. Those refusals ride the
 * opt-in `compilerDiagnostics` channel (`logs: ['compiler']`); the default
 * channel carries none of them.
 * Guard correction (E8-class): non-vacuity reads the opt-in channel, since
 * the default channel must carry no unknown-value refusals by contract.
 */
import { expect } from 'vitest'
import { compileCase, hasWant, type AtomicCaseSpec } from '../../helpers.js'

/** Unknown-value refusal codes: dynamic shapes and unfoldable positions. */
function isUnknownValue(code: string): boolean {
  return code.startsWith('ATM-W-DYNAMIC-') || code.startsWith('ATM-W-UNFOLDABLE')
}

const spec: AtomicCaseSpec = {
  id: 'ATM-DIAG-11',
  async verify(result) {
    // The static sibling still extracts beside seven refusal shapes.
    expect(hasWant(result, 'mt', '2r')).toBe(true)

    // Opt-in: the requested channel returns the refusals, separately.
    const opted = await compileCase(
      'ATM-DIAG-11',
      { logs: ['compiler'] } as unknown as Parameters<typeof compileCase>[1]
    )
    const compilerDiags = (
      opted as unknown as {
        compilerDiagnostics?: Array<{ code: string; message: string }>
      }
    ).compilerDiagnostics
    expect(
      compilerDiags,
      'compiler channel populates compilerDiagnostics when requested'
    ).toBeDefined()

    // Guard: the fixture must actually refuse unknown values today,
    // otherwise the silence assertion below would pass vacuously. Reads
    // the opt-in channel (E8-class correction — the default must carry none).
    expect(
      compilerDiags!.some(d => isUnknownValue(d.code ?? '')),
      'fixture refuses no unknown values to silence'
    ).toBe(true)

    // RED: no unknown-value refusal may appear on the default channel.
    const diagnostics = result.diagnostics ?? []
    const leaked = diagnostics.filter(d => isUnknownValue(d.code ?? ''))
    expect(
      leaked,
      `unknown values leaked onto default: ${leaked.map(d => d.code).join(', ')}`
    ).toHaveLength(0)
  },
}

export default spec
