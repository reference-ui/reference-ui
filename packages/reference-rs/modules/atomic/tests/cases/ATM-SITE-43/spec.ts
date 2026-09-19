/**
 * TS enum member fence (ATM-SITE-43, SPEC-V2-45). Initialized string, numeric,
 * unary-numeric, boolean, and computed (`+` binaries, templates, `!`/`~`,
 * wrapped) members fold; member-reference and uninitialized members warn
 * per member with siblings kept; an inner const shadows the enum. Boolean
 * members record and refuse at resolve, exactly like bare bools
 * (planless, one InvalidCssValue warning).
 */
import { expect } from 'vitest'
import { getWantsForProp, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-43',
  verify(result) {
    expect(hasWant(result, 'padding', '4px')).toBe(true)
    expect(hasWant(result, 'padding', '2px')).toBe(true)
    expect(hasWant(result, 'margin', '8px')).toBe(true)
    expect(hasWant(result, 'margin', '3r')).toBe(true)
    expect(hasWant(result, 'width', '12px')).toBe(true)
    expect(hasWant(result, 'height', '4px')).toBe(true)
    expect(hasWant(result, 'zIndex', 99)).toBe(true)
    expect(hasWant(result, 'order', 1)).toBe(true)
    expect(hasWant(result, 'top', -1)).toBe(true)
    expect(hasWant(result, 'left', 2)).toBe(true)
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(hasWant(result, 'color', 'blue')).toBe(true)
    expect(hasWant(result, 'zIndex', 42)).toBe(true)
    expect(hasWant(result, 'backgroundColor', 'blue')).toBe(true)
    expect(hasWant(result, 'top', -2)).toBe(true)
    expect(hasWant(result, 'flexGrow', true)).toBe(true)
    expect(getWantsForProp(result, 'flexGrow')).toHaveLength(2)
    expect(result.wants ?? []).toHaveLength(19)

    expect(getWantsForProp(result, 'padding')).toHaveLength(3)
    expect(getWantsForProp(result, 'margin')).toHaveLength(3)

    const plans = result.runtime.stylePlans
    expect(plans).toHaveLength(15)

    const diagnostics = result.diagnostics ?? []
    expect(diagnostics).toHaveLength(4)
    const codes = diagnostics.map(d => d.code).sort()
    expect(codes).toEqual([
      'ATM-W-DYNAMIC-MEMBER',
      'ATM-W-DYNAMIC-MEMBER',
      'ATM-W-INVALID-CSS-VALUE',
      'ATM-W-INVALID-CSS-VALUE',
    ])
  },
}

export default spec
