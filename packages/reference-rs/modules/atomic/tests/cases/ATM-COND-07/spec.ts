/**
 * Responsive `r` station. Numeric and named keys become `@container`
 * wrappers. Unknown names warn and do not emit a rule.
 * (S6 E8-class re-point: the unknown-breakpoint refusal rides the opt-in
 * compiler channel; the default channel is silent.)
 */
import { expect } from 'vitest'
import { compileCase, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-COND-07',
  async verify(result) {
    expect(hasWant(result, 'p', '1r', ['@container (min-width: 300px)'])).toBe(true)
    expect(hasWant(result, 'mt', '2r', ['@container (min-width: 768px)'])).toBe(true)
    expect(hasWant(result, 'p', '3r')).toBe(false)
    expect(result.stylesheet).toContain('@container (min-width: 300px)')
    expect(result.stylesheet).toContain('@container (min-width: 768px)')

    // The refusal proves no exact runtime miss, so the default is silent.
    expect(result.diagnostics ?? []).toHaveLength(0)

    // Opt-in: the same refusal is visible on the compiler channel.
    const opted = await compileCase('ATM-COND-07', { logs: ['compiler'] })
    expect(opted.compilerDiagnostics, 'opt-in channel populates').toBeDefined()
    const channel = opted.compilerDiagnostics ?? []
    const breaks = channel.filter(d => d.code === 'ATM-W-UNKNOWN-BREAKPOINT')
    expect(breaks).toHaveLength(1)
    expect(breaks[0]?.message).toContain('wat')
  },
}

export default spec
