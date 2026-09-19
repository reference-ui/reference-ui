/**
 * Imported-spread station (ATM-SITE-39, SPEC-V2-51). An imported const
 * object spreads at top level beside a static sibling and under `_hover`.
 * One want and one runtime plan per leaf; zero diagnostics.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-39',
  verify(result) {
    expect(hasWant(result, 'color', 'red', [])).toBe(true)
    expect(hasWant(result, 'backgroundColor', 'blue', [])).toBe(true)
    expect(hasWant(result, 'color', 'red', ['_hover'])).toBe(true)
    expect(result.wants ?? []).toHaveLength(3)

    const plans = result.runtime.stylePlans
    expect(plans).toHaveLength(3)

    expect(result.diagnostics ?? []).toHaveLength(0)

    expect(result.stylesheet).toContain('color: red;')
    expect(result.stylesheet).toContain('background-color: blue;')
  },
}

export default spec
