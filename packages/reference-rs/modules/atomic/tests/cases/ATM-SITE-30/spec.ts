/**
 * Unary-literal pin station (ATM-SITE-30, SPEC-V2-08) with the Ph2 arms for
 * static backticks (SPEC-V2-13) and the micro-fold bundle (SPEC-V2-36).
 * `-4`, `-0.5`, and `+50` fold at the literal with one want and one runtime
 * plan per leaf; `-0` canonicalizes to `0` on both sides. Backtick values
 * fold as plain strings; shorthand, empty, string-head, nested-cx, and
 * no-arg call forms fold or skip with zero diagnostics.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-30',
  verify(result) {
    expect(hasWant(result, 'margin', -4)).toBe(true)
    expect(hasWant(result, 'opacity', -0.5)).toBe(true)
    expect(hasWant(result, 'width', 50)).toBe(true)
    expect(hasWant(result, 'order', 0)).toBe(true)
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(hasWant(result, 'margin', '4px')).toBe(true)
    expect(hasWant(result, 'color', 'blue')).toBe(true)
    expect(hasWant(result, 'color', 'green')).toBe(true)
    expect(hasWant(result, 'color', 'purple')).toBe(true)
    expect(result.wants ?? []).toHaveLength(9)

    const plans = result.stylePlans
    expect(plans).toHaveLength(9)
    expect(plans.some(p => p.prop === 'margin' && p.value === -4)).toBe(true)
    expect(plans.some(p => p.prop === 'opacity' && p.value === -0.5)).toBe(true)
    expect(plans.some(p => p.prop === 'width' && p.value === 50)).toBe(true)
    expect(plans.some(p => p.prop === 'order' && p.value === 0)).toBe(true)
    expect(plans.some(p => p.prop === 'color' && p.value === 'red')).toBe(true)
    expect(plans.some(p => p.prop === 'margin' && p.value === '4px')).toBe(true)
    expect(plans.some(p => p.prop === 'color' && p.value === 'blue')).toBe(true)
    expect(plans.some(p => p.prop === 'color' && p.value === 'green')).toBe(true)
    expect(plans.some(p => p.prop === 'color' && p.value === 'purple')).toBe(true)

    expect(result.diagnostics ?? []).toHaveLength(0)

    expect(result.stylesheet).toContain('margin: -4px;')
    expect(result.stylesheet).toContain('opacity: -0.5;')
    expect(result.stylesheet).toContain('width: 50px;')
    expect(result.stylesheet).toContain('order: 0;')
    expect(result.stylesheet).toContain('color: red;')
    expect(result.stylesheet).toContain('margin: 4px;')
    expect(result.stylesheet).toContain('color: blue;')
    expect(result.stylesheet).toContain('color: green;')
    expect(result.stylesheet).toContain('color: purple;')
  },
}

export default spec
