/**
 * Optional-chain drop station (SPEC-V2-44). `?.` on an unresolvable base
 * warns once and mints nothing at the site while static siblings in the
 * same object still extract with their runtime plans.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-74',
  verify(result) {
    expect(hasWant(result, 'color', 'foo')).toBe(false)
    expect(hasWant(result, 'padding', '4px')).toBe(true)
    expect(
      result.runtime.stylePlans.find(p => p.prop === 'padding' && p.value === '4px'),
    ).toBeDefined()

    const diagnostics = result.diagnostics ?? []
    const warnings = diagnostics.filter(d => d.severity === 'warning')
    const infos = diagnostics.filter(d => d.severity === 'info')
    expect(warnings).toHaveLength(1)
    expect(warnings[0]!.message).toMatch(/Dynamic non-literal/)
    expect(infos).toHaveLength(1)
    expect(infos[0]!.code).toBe('ATM-I-HARVEST-SINK')
  },
}

export default spec
