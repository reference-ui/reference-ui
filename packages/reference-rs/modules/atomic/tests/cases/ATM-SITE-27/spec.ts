/**
 * Object-arm and mid-array ternary station (ATM-SITE-27, SPEC-V2-17 +
 * SPEC-V2-27 + §3 S3). Object-valued arms compile per arm; a lone
 * unfoldable arm keeps its resolvable sibling plus one warning. Mid-array
 * ternaries project both arms at one breakpoint, elision keeps arity, and
 * top-level ternary args extract both arms.
 */
import { expect } from 'vitest'
import { getWantsForProp, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-27',
  verify(result) {
    expect(hasWant(result, 'color', 'white', ['base'])).toBe(true)
    expect(hasWant(result, 'color', 'black', ['base'])).toBe(true)
    expect(getWantsForProp(result, 'color').filter(w =>
      (w.value as Record<string, string>).String === 'white',
    )).toHaveLength(2)
    expect(getWantsForProp(result, 'color').filter(w =>
      (w.value as Record<string, string>).String === 'black',
    )).toHaveLength(2)
    expect(hasWant(result, 'color', 'red', [])).toBe(true)
    expect(hasWant(result, 'color', 'blue', [])).toBe(true)

    expect(hasWant(result, 'padding', 2, ['base'])).toBe(true)
    expect(hasWant(result, 'padding', 2, ['sm'])).toBe(true)
    expect(hasWant(result, 'padding', 3, ['sm'])).toBe(true)
    expect(hasWant(result, 'padding', 4, ['md'])).toBe(true)
    expect(hasWant(result, 'padding', 1, ['base'])).toBe(true)
    expect(hasWant(result, 'padding', 3, ['md'])).toBe(true)

    expect(result.wants ?? []).toHaveLength(12)

    const plans = result.runtime.stylePlans
    expect(plans).toHaveLength(5)
    expect(plans.some(p => p.prop === 'color' && p.value === 'red')).toBe(true)
    expect(plans.some(p => p.prop === 'color' && p.value === 'blue')).toBe(true)
    expect(plans.some(
      p => p.prop === 'color' && JSON.stringify(p.value) === '{"base":"white"}',
    )).toBe(true)
    expect(plans.some(
      p => p.prop === 'color' && JSON.stringify(p.value) === '{"base":"black"}',
    )).toBe(true)
    expect(plans.some(
      p => p.prop === 'padding' && JSON.stringify(p.value) === '[1,null,3]',
    )).toBe(true)

    expect(result.diagnostics ?? []).toHaveLength(2)
    for (const diagnostic of result.diagnostics ?? []) {
      expect(diagnostic.severity).toBe('warning')
      expect(diagnostic.message).toMatch(/Dynamic non-literal expression/)
    }

    expect(result.stylesheet).toContain('color: white;')
    expect(result.stylesheet).toContain('color: black;')
    expect(result.stylesheet).toContain('color: red;')
    expect(result.stylesheet).toContain('color: blue;')
  },
}

export default spec
