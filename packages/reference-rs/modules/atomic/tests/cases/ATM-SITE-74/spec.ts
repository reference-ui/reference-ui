/**
 * Optional-chain drop station (SPEC-V2-44). `?.` on an unresolvable base
 * warns once and mints nothing while static siblings in the same object
 * still extract with their runtime plans.
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
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]!.severity).toBe('warning')
    expect(diagnostics[0]!.message).toMatch(/Dynamic non-literal/)
  },
}

export default spec
