/**
 * Unknown-values station (ATM-DIAG-11, Operation Error Correct, Slice 0).
 * RED: identifiers, members, `${n}px` / `${color}` templates, calls, `a+b`
 * binaries, and spreads never become userspace warnings — refusal without
 * an exact expected lookup proves no runtime miss. Today they warn on
 * default (`ATM-DIAG-02` / `ATM-DIAG-05` pin that), so the assertion fails.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

/** Unknown-value refusal codes: dynamic shapes and unfoldable positions. */
function isUnknownValue(code: string): boolean {
  return code.startsWith('ATM-W-DYNAMIC-') || code.startsWith('ATM-W-UNFOLDABLE')
}

const spec: AtomicCaseSpec = {
  id: 'ATM-DIAG-11',
  verify(result) {
    // The static sibling still extracts beside seven refusal shapes.
    expect(hasWant(result, 'mt', '2r')).toBe(true)

    const diagnostics = result.diagnostics ?? []

    // Guard: the fixture must actually refuse unknown values today,
    // otherwise the silence assertion below would pass vacuously.
    expect(
      diagnostics.some(d => isUnknownValue(d.code ?? '')),
      'fixture refuses no unknown values to silence'
    ).toBe(true)

    // RED: no unknown-value refusal may appear on the default channel.
    const leaked = diagnostics.filter(d => isUnknownValue(d.code ?? ''))
    expect(
      leaked,
      `unknown values leaked onto default: ${leaked.map(d => d.code).join(', ')}`
    ).toHaveLength(0)
  },
}

export default spec
