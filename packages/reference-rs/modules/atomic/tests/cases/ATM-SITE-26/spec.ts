/**
 * Call-arg unwrap station (ATM-SITE-26, Overmatch Ph1). Wrapped css()
 * args (parens, as const, satisfies, !, .ts-only <any>) extract like the
 * bare arg with one runtime plan per want and zero diagnostics.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const EXPECTED: Array<{ prop: string; value: string }> = [
  { prop: 'color', value: 'red' },
  { prop: 'color', value: 'orange' },
  { prop: 'color', value: 'yellow' },
  { prop: 'color', value: 'green' },
  { prop: 'color', value: 'lime' },
  { prop: 'padding', value: '1r' },
  { prop: 'margin', value: '2r' },
  { prop: 'color', value: 'purple' },
  { prop: 'color', value: 'teal' },
  { prop: 'color', value: 'navy' },
  { prop: 'color', value: 'pink' },
  { prop: 'color', value: 'cyan' },
]

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-26',
  verify(result) {
    for (const { prop, value } of EXPECTED) {
      expect(hasWant(result, prop, value)).toBe(true)
    }
    expect(result.wants ?? []).toHaveLength(EXPECTED.length)
    expect(result.diagnostics ?? []).toHaveLength(0)

    // One runtime plan per unwrapped leaf.
    const plans = result.stylePlans
    expect(plans).toHaveLength(EXPECTED.length)
    for (const { prop, value } of EXPECTED) {
      expect(plans.some(p => p.prop === prop && p.value === value)).toBe(true)
    }

    for (const color of ['red', 'orange', 'yellow', 'green', 'lime', 'purple', 'teal', 'navy', 'pink', 'cyan']) {
      expect(result.stylesheet).toContain(`color: ${color};`)
    }
  },
}

export default spec
