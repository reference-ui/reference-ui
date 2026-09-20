/**
 * Bare-spread station (SPEC-V2-21 GAP-21). An unresolvable bare identifier
 * spread warns exactly once and is skipped while static siblings in the
 * same object still extract with their runtime plans.
 */
import { expect } from 'vitest'
import { compileCase, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-66',
  async verify(result) {
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(
      result.runtime.stylePlans.find(p => p.prop === 'color' && p.value === 'red'),
    ).toBeDefined()
    expect(result.css?.classes?.['color:red']).toBe('@reference-ui/lib__c_red')

    // The bare-spread refusal rides the opt-in channel now (S6 E8-class
    // re-point); the default is silent.
    expect(result.diagnostics ?? []).toHaveLength(0)
    const opted = await compileCase('ATM-SITE-66', { logs: ['compiler'] })
    expect(opted.compilerDiagnostics, 'opt-in channel populates').toBeDefined()
    const spreads = (opted.compilerDiagnostics ?? []).filter(
      d => d.code === 'ATM-W-UNFOLDABLE-SPREAD'
    )
    expect(spreads).toHaveLength(1)
    expect(spreads[0]!.severity).toBe('warning')
    expect(spreads[0]!.message).toMatch(/spread/i)
  },
}

export default spec
