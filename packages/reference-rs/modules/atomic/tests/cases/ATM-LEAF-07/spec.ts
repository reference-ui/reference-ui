/**
 * Dynamic-sibling extract station. Unresolvable properties and call-expression
 * ternary arms diagnose; static neighbours and the literal arm still become wants.
 */
import { expect } from 'vitest'
import { compileCase, getWantsForProp, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-LEAF-07',
  async verify(result) {
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(hasWant(result, 'height', '100px')).toBe(true)
    expect(hasWant(result, 'color', 'black')).toBe(true)
    expect(getWantsForProp(result, 'color').length).toBeGreaterThanOrEqual(2)

    // The refusals ride the opt-in channel now (S6 E8-class re-point);
    // the default is silent.
    expect(result.diagnostics ?? []).toHaveLength(0)
    const opted = await compileCase('ATM-LEAF-07', { logs: ['compiler'] })
    expect(opted.compilerDiagnostics, 'opt-in channel populates').toBeDefined()
    const channel = opted.compilerDiagnostics ?? []
    const warnings = channel.filter(d => d.severity === 'warning')
    expect(warnings.length).toBeGreaterThanOrEqual(1)
    expect(
      warnings.some(d => d.code === 'ATM-W-DYNAMIC-MEMBER'),
      'member refusal visible opt-in'
    ).toBe(true)
  },
}

export default spec
