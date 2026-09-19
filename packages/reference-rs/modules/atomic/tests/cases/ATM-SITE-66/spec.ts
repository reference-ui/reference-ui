/**
 * Bare-spread station (SPEC-V2-21 GAP-21). An unresolvable bare identifier
 * spread warns exactly once and is skipped while static siblings in the
 * same object still extract with their runtime plans.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-66',
  verify(result) {
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(
      result.runtime.stylePlans.find(p => p.prop === 'color' && p.value === 'red'),
    ).toBeDefined()
    expect(result.css?.classes?.['color:red']).toBe('@reference-ui/lib__c_red')

    const diagnostics = result.diagnostics ?? []
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]!.severity).toBe('warning')
    expect(diagnostics[0]!.message).toMatch(/spread/i)
  },
}

export default spec
