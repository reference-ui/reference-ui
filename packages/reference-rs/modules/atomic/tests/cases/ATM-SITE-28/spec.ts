/**
 * Mutation station (ATM-SITE-28, Overmatch Ph1). A `let`/`var` with any
 * assignment drops to a diagnostic naming the write; unmutated `let`/`var`
 * (SPEC-V2-02) and unmutated `export let` (SPEC-V2-53) resolve like `const`.
 */
import { expect } from 'vitest'
import { getWantsForProp, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const EXPECTED: Array<{ prop: string; value: string }> = [
  { prop: 'color', value: 'blue.600' },
  { prop: 'padding', value: '4px' },
  { prop: 'color', value: 'green' },
  { prop: 'color', value: 'amber.500' },
]

const MUTATED: Array<{ name: string; site: string }> = [
  { name: 'color', site: 'mutated.ts:5:1' },
  { name: 'count', site: 'mutated.ts:10:1' },
  { name: 'bump', site: 'mutated.ts:15:1' },
  { name: 'theme', site: 'mutated.ts:20:1' },
  { name: 'picked', site: 'mutated.ts:25:6' },
  { name: 'palette', site: 'mutated.ts:31:1' },
  { name: 'shifted', site: 'tokens.ts:5:1' },
]

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-28',
  verify(result) {
    for (const { prop, value } of EXPECTED) {
      expect(hasWant(result, prop, value)).toBe(true)
    }
    expect(result.wants ?? []).toHaveLength(5)

    // Stale inits never emit: no `red` color, no numeric order.
    expect(hasWant(result, 'color', 'red')).toBe(false)
    expect(getWantsForProp(result, 'order')).toHaveLength(0)

    // One runtime plan per unique leaf (the two `padding: 4px` wants share one).
    const plans = result.runtime.stylePlans
    expect(plans).toHaveLength(4)
    for (const { prop, value } of EXPECTED) {
      expect(plans.some(p => p.prop === prop && p.value === value)).toBe(true)
    }

    // Every mutated use warns once and names its write site.
    const diagnostics = result.diagnostics ?? []
    expect(diagnostics).toHaveLength(MUTATED.length)
    for (const { name, site } of MUTATED) {
      const match = diagnostics.find(d =>
        d.message.includes(`Dynamic mutated binding '${name}'`),
      )
      expect(match, `missing mutated diagnostic for '${name}'`).toBeDefined()
      expect(match!.severity).toBe('warning')
      expect(match!.message).toContain('reassigned at')
      expect(match!.message).toContain(site)
    }

    expect(result.stylesheet).toContain('color: var(--colors-blue-600);')
    expect(result.stylesheet).toContain('color: green;')
    expect(result.stylesheet).toContain('color: var(--colors-amber-500);')
    expect(result.stylesheet).toContain('padding: 4px;')
    expect(result.stylesheet).not.toContain('color: red')
  },
}

export default spec
