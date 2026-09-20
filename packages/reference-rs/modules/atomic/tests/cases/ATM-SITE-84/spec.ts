/**
 * Origin-precision station (Forge §3). An import resolves to its origin
 * binding only: a same-named write in another file never blocks an import
 * that resolves to an unmutated export, while the written file's own uses
 * still diagnose the write.
 */
import { expect } from 'vitest'
import { compileCase, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-84',
  async verify(result) {
    // The import folds the origin's raw value despite the same-named write.
    expect(hasWant(result, 'color', '#f59e0b')).toBe(true)
    expect(result.wants ?? []).toHaveLength(1)

    // The written file's own use names its write on the opt-in channel
    // (S6 E8-class re-point); the default is silent.
    expect(result.diagnostics ?? []).toHaveLength(0)
    const opted = await compileCase('ATM-SITE-84', { logs: ['compiler'] })
    expect(opted.compilerDiagnostics, 'opt-in channel populates').toBeDefined()
    const moved = (opted.compilerDiagnostics ?? []).filter(
      d => d.code !== 'ATM-I-EXPECTED-LOOKUP' && d.code !== 'ATM-I-DYNAMIC-SLOT'
    )
    expect(moved).toHaveLength(1)
    expect(moved).toEqual([
      expect.objectContaining({
        severity: 'warning',
        code: 'ATM-W-MUTATED-BINDING',
      }),
    ])
    expect(moved?.[0]?.message).toContain(
      "Dynamic mutated binding 'glow' encountered for prop 'color'",
    )
  },
}

export default spec
