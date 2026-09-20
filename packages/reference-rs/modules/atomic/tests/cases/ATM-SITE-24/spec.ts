/**
 * Colliding-spread union station (ATM-SITE-24, SPEC-V2-22). A static key
 * plus a spread ternary on the same key unions all three values, with the
 * static key after or before the spread. One want and one runtime plan per
 * value; zero diagnostics.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-24',
  verify(result) {
    for (const value of ['0', '1', '2', '3', '4', '5']) {
      expect(hasWant(result, 'padding', value)).toBe(true)
    }
    expect(result.wants ?? []).toHaveLength(6)

    const plans = result.stylePlans
    expect(plans).toHaveLength(6)
    for (const value of ['0', '1', '2', '3', '4', '5']) {
      expect(plans.some(p => p.prop === 'padding' && p.value === value)).toBe(true)
    }

    expect(result.diagnostics ?? []).toHaveLength(0)

    for (const decl of [
      'padding: 0;',
      'padding: 1px;',
      'padding: 2px;',
      'padding: 3px;',
      'padding: 4px;',
      'padding: 5px;',
    ]) {
      expect(result.stylesheet).toContain(decl)
    }
  },
}

export default spec
