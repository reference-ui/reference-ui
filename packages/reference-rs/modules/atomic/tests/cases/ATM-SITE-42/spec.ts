/**
 * Destructuring station (ATM-SITE-42, SPEC-V2-32, Overmatch Ph3). Object and
 * array patterns bind the const entries they select — shorthand, rename,
 * rest, indices, defaults, and computed keys — so uses resolve exactly like
 * the member or index they abbreviate. Unresolvable sources stay dynamic
 * with a diagnostic while static siblings still extract.
 */
import { expect } from 'vitest'
import {
  getWantsForProp,
  harvestWants,
  hasWant,
  siteWants,
  type AtomicCaseSpec,
} from '../../helpers.js'

const EXPECTED: Array<{ prop: string; value: string }> = [
  { prop: 'color', value: 'red' },
  { prop: 'color', value: 'blue.600' },
  { prop: 'padding', value: '4px' },
  { prop: 'margin', value: '8px' },
  { prop: 'padding', value: '8px' },
  { prop: 'padding', value: '1px' },
  { prop: 'margin', value: '2px' },
  { prop: 'color', value: 'blue' },
]

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-42',
  verify(result) {
    for (const { prop, value } of EXPECTED) {
      expect(hasWant(result, prop, value)).toBe(true)
    }
    // Fifteen site wants: basic, rename, rest spread (2) + rest member,
    // array identifier + inline (2), default-missing, default-present,
    // computed key, branching entry (2), array-rest chain, and the
    // warn-control sibling. Red/blue twin site atoms, so the refused
    // ghost position infos a zero count.
    expect(siteWants(result)).toHaveLength(15)
    expect(harvestWants(result)).toHaveLength(0)
    expect(result.wants ?? []).toHaveLength(15)

    // The branching entry fans out to both arms.
    expect(siteWants(result).filter(w => w.prop === 'color')).toHaveLength(7)
    expect(getWantsForProp(result, 'color')).toHaveLength(7)

    // One runtime plan per unique leaf.
    const plans = result.runtime.stylePlans
    expect(plans).toHaveLength(EXPECTED.length)
    for (const { prop, value } of EXPECTED) {
      expect(plans.some(p => p.prop === prop && p.value === value)).toBe(true)
    }

    // The unresolvable-source destructure warns once and mints nothing at
    // the site.
    const diagnostics = result.diagnostics ?? []
    const warnings = diagnostics.filter(d => d.severity === 'warning')
    const infos = diagnostics.filter(d => d.severity === 'info')
    // The color sink is covered incidentally (every offered value is a
    // static plan, zero net-new), so the ghost refusal stays silent.
    expect(warnings).toHaveLength(0)
    expect(infos).toHaveLength(0)
    expect(hasWant(result, 'color', 'ghost')).toBe(false)

    expect(result.stylesheet).toContain('color: red;')
    expect(result.stylesheet).toContain('color: var(--colors-blue-600);')
    expect(result.stylesheet).toContain('color: blue;')
    expect(result.stylesheet).toContain('padding: 4px;')
    expect(result.stylesheet).toContain('margin: 8px;')
  },
}

export default spec
