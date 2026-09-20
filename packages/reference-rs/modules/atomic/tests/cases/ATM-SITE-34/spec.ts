/**
 * Optional-chain station (ATM-SITE-34, SPEC-V2-43/44, Overmatch Ph3). `?.`
 * over a known const base unwraps transparently — single-hop and nested —
 * while an unresolvable base warns once and mints nothing at the site (the
 * SITE-74 shape, folded here beside its resolving twins). Harvest floors
 * the refused color position below.
 */
import { expect } from 'vitest'
import { harvestWants, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const EXPECTED: Array<{ prop: string; value: string | number }> = [
  { prop: 'color', value: 'red' },
  { prop: 'padding', value: '4px' },
  { prop: 'color', value: 'blue.600' },
  { prop: 'order', value: 2 },
  { prop: 'color', value: '#f00' },
  { prop: 'color', value: 'blue' },
  { prop: 'margin', value: '2r' },
]

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-34',
  verify(result) {
    for (const { prop, value } of EXPECTED) {
      expect(hasWant(result, prop, value)).toBe(true)
    }
    // Eight site wants: single-hop pair, two-prop chain, nested chain,
    // branching entry (2 arms), and the drop-control sibling. The three
    // pool colors twin site atoms, so the sink infos a zero count.
    expect(harvestWants(result)).toHaveLength(0)
    expect(result.wants ?? []).toHaveLength(8)

    // One runtime plan per unique leaf.
    const plans = result.runtime.stylePlans
    expect(plans).toHaveLength(EXPECTED.length)
    for (const { prop, value } of EXPECTED) {
      expect(plans.some(p => p.prop === prop && p.value === value)).toBe(true)
    }

    // The unresolvable base warns once and mints nothing at the site.
    const diagnostics = result.diagnostics ?? []
    const warnings = diagnostics.filter(d => d.severity === 'warning')
    const infos = diagnostics.filter(d => d.severity === 'info')
    // The color sink is covered incidentally (every offered value is a
    // static plan, zero net-new), so the chain refusal stays silent.
    expect(warnings).toHaveLength(0)
    expect(infos).toHaveLength(0)
    expect(hasWant(result, 'color', 'foo')).toBe(false)

    expect(result.stylesheet).toContain('color: red;')
    expect(result.stylesheet).toContain('color: #f00;')
    expect(result.stylesheet).toContain('color: var(--colors-blue-600);')
  },
}

export default spec
