/**
 * Unary-literal pin station (ATM-SITE-30, SPEC-V2-08). `-4`, `-0.5`, and
 * `+50` fold at the literal with one want and one runtime plan per leaf;
 * `-0` canonicalizes to `0` on both sides. Zero diagnostics.
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
    expect(result.wants ?? []).toHaveLength(4)

    const plans = result.runtime.stylePlans
    expect(plans).toHaveLength(4)
    expect(plans.some(p => p.prop === 'margin' && p.value === -4)).toBe(true)
    expect(plans.some(p => p.prop === 'opacity' && p.value === -0.5)).toBe(true)
    expect(plans.some(p => p.prop === 'width' && p.value === 50)).toBe(true)
    expect(plans.some(p => p.prop === 'order' && p.value === 0)).toBe(true)

    expect(result.diagnostics ?? []).toHaveLength(0)

    expect(result.stylesheet).toContain('margin: -4px;')
    expect(result.stylesheet).toContain('opacity: -0.5;')
    expect(result.stylesheet).toContain('width: 50px;')
    expect(result.stylesheet).toContain('order: 0;')
  },
}

export default spec
