/**
 * Object-spread extract station. Inline spreads unpack; logical and ternary
 * spreads keep siblings and both arms. Same-key ternary spreads yield two wants.
 * Dynamic unresolvable spread guards emit diagnostic warnings.
 */
import { expect } from 'vitest'
import { compileCase, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-05',
  async verify(result) {
    expect(hasWant(result, 'margin', '10px')).toBe(true)
    expect(hasWant(result, 'padding', '20px')).toBe(true)
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(hasWant(result, 'padding', '10px')).toBe(true)
    expect(hasWant(result, 'margin', '20px')).toBe(true)

    // The two spread refusals ride the opt-in channel now (S6 E8-class
    // re-point); the default is silent.
    expect(result.diagnostics ?? []).toHaveLength(0)
    const opted = await compileCase('ATM-SITE-05', { logs: ['compiler'] })
    expect(opted.compilerDiagnostics, 'opt-in channel populates').toBeDefined()
    const spreads = (opted.compilerDiagnostics ?? []).filter(
      d => d.code === 'ATM-W-UNFOLDABLE-SPREAD'
    )
    expect(spreads).toHaveLength(2)
  },
}

export default spec
