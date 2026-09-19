/**
 * Param type-literal fence (ATM-SITE-44, SPEC-V2-46). Required literal members
 * fold through member reads and destructured twins (plain and rename);
 * untyped, optional-member, partial, non-literal, nested, rest, and defaulted
 * params warn per use with margin siblings kept. All-or-nothing: one
 * unfoldable member refuses the whole annotation.
 */
import { expect } from 'vitest'
import { getWantsForProp, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-44',
  verify(result) {
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(hasWant(result, 'color', 'blue')).toBe(true)
    expect(hasWant(result, 'fontSize', 4)).toBe(true)
    for (const value of ['1r', '2r', '3r', '4r', '5r', '6r', '7r']) {
      expect(hasWant(result, 'margin', value)).toBe(true)
    }
    expect(getWantsForProp(result, 'color')).toHaveLength(3)
    expect(result.wants ?? []).toHaveLength(11)

    // `paint` and `destructure` share one (color, red) plan by lookup key.
    const plans = result.runtime.stylePlans
    expect(plans).toHaveLength(10)

    const diagnostics = result.diagnostics ?? []
    expect(diagnostics).toHaveLength(7)
    const codes = diagnostics.map(d => d.code).sort()
    expect(codes).toEqual([
      'ATM-W-DYNAMIC-IDENTIFIER',
      'ATM-W-DYNAMIC-IDENTIFIER',
      'ATM-W-DYNAMIC-MEMBER',
      'ATM-W-DYNAMIC-MEMBER',
      'ATM-W-DYNAMIC-MEMBER',
      'ATM-W-DYNAMIC-MEMBER',
      'ATM-W-DYNAMIC-MEMBER',
    ])
    const messages = diagnostics.map(d => d.message).join('\n')
    expect(messages).toMatch(/'color'.*'color'/)
  },
}

export default spec
