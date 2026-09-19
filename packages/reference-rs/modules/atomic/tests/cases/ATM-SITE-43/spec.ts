/**
 * TS enum member fence (ATM-SITE-43, SPEC-V2-45). Initialized string, numeric,
 * unary-numeric, and boolean members fold; member-reference, computed, and
 * uninitialized members warn per member with siblings kept; an inner const
 * shadows the enum. Boolean members record and refuse at resolve, exactly
 * like bare bools (planless, one InvalidCssValue warning).
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
    expect(hasWant(result, 'flexGrow', true)).toBe(true)
    expect(result.wants ?? []).toHaveLength(12)

    expect(getWantsForProp(result, 'padding')).toHaveLength(2)

    const plans = result.runtime.stylePlans
    expect(plans).toHaveLength(11)

    const diagnostics = result.diagnostics ?? []
    expect(diagnostics).toHaveLength(4)
    const codes = diagnostics.map(d => d.code).sort()
    expect(codes).toEqual([
      'ATM-W-DYNAMIC-MEMBER',
      'ATM-W-DYNAMIC-MEMBER',
      'ATM-W-DYNAMIC-MEMBER',
      'ATM-W-INVALID-CSS-VALUE',
    ])
  },
}

export default spec
