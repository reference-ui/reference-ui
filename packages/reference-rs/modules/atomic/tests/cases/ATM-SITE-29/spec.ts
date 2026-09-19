/**
 * Member-depth station (ATM-SITE-29, SPEC-V2-24/31/34). Multi-hop member
 * reads, member-hop spreads, `!` unwrapping, scalar and object alias
 * chains, and nested conditions all resolve; nested responsive maps lower
 * like inline objects. Zero diagnostics throughout.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const READS: Array<{ prop: string; value: string | number; when?: string[] }> = [
  { prop: 'color', value: '#f00' },
  { prop: 'color', value: 'black' },
  { prop: 'order', value: 2 },
  { prop: 'color', value: 'red' },
  { prop: 'color', value: 'blue' },
  { prop: 'color', value: 'crimson' },
  { prop: 'color', value: 'teal' },
  { prop: 'margin', value: '6px' },
  { prop: 'color', value: 'red', when: ['_hover'] },
  { prop: 'color', value: 'blue', when: ['_hover'] },
  { prop: 'padding', value: '1r', when: ['base'] },
  { prop: 'padding', value: '2r', when: ['md'] },
  { prop: 'color', value: 'indigo', when: ['_dark'] },
  { prop: 'bg', value: '#f00' },
]

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-29',
  verify(result) {
    // Every read resolves: 20 wants across the four inputs.
    for (const { prop, value, when } of READS) {
      expect(hasWant(result, prop, value, when ?? [])).toBe(true)
    }
    expect(result.wants ?? []).toHaveLength(20)

    // Member-hop spreads fan branch leaves: two colors from `...styles.hover`.
    const hoverColors = (result.wants ?? []).filter(w => w.prop === 'color').length
    expect(hoverColors).toBeGreaterThanOrEqual(2)

    // One runtime plan per unique leaf, conditions carried.
    const plans = result.runtime.stylePlans
    expect(plans).toHaveLength(14)
    for (const { prop, value, when } of READS) {
      expect(
        plans.some(
          p =>
            p.prop === prop &&
            p.value === value &&
            JSON.stringify(p.when ?? []) === JSON.stringify(when ?? []),
        ),
      ).toBe(true)
    }

    expect(result.diagnostics ?? []).toHaveLength(0)

    expect(result.stylesheet).toContain('color: #f00;')
    expect(result.stylesheet).toContain('color: crimson;')
    expect(result.stylesheet).toContain('color: teal;')
  },
}

export default spec
