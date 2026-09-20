/**
 * Optional-chain drop station (SPEC-V2-44). `?.` on an unresolvable base
 * warns once and mints nothing at the site while static siblings in the
 * same object still extract with their runtime plans.
 */
import { expect } from 'vitest'
import { compileCase, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-74',
  async verify(result) {
    expect(hasWant(result, 'color', 'foo')).toBe(false)
    expect(hasWant(result, 'padding', '4px')).toBe(true)
    expect(
      result.runtime.stylePlans.find(p => p.prop === 'padding' && p.value === '4px'),
    ).toBeDefined()

    // The chain refusal rides the opt-in channel now (S6 E8-class
    // re-point); the default is silent.
    expect(result.diagnostics ?? []).toHaveLength(0)
    const opted = await compileCase('ATM-SITE-74', { logs: ['compiler'] })
    expect(opted.compilerDiagnostics, 'opt-in channel populates').toBeDefined()
    const channel = opted.compilerDiagnostics ?? []
    const warnings = channel.filter(d => d.severity === 'warning')
    const infos = channel.filter(d => d.code === 'ATM-I-HARVEST-SINK')
    expect(warnings).toHaveLength(1)
    expect(warnings[0]!.message).toMatch(/Dynamic non-literal/)
    expect(infos).toHaveLength(1)
    expect(infos[0]!.code).toBe('ATM-I-HARVEST-SINK')
  },
}

export default spec
