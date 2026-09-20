/**
 * Exact-plan-present station (ATM-DIAG-08, Operation Error Correct, Slice 0).
 * Diagnostics predicts a static runtime query, the same key is in
 * `stylePlans`, and userspace is silent. The RED HINGE is the opt-in
 * compiler channel recording the exact expected lookup: no independent
 * analysis and no channel exist yet, so the hinge fails.
 */
import { expect } from 'vitest'
import { compileCase, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-DIAG-08',
  async verify(result) {
    // Presence half (green today): the static declaration lands in stylePlans.
    const plans = result.runtime?.stylePlans ?? []
    const exact = plans.find(
      p => p.prop === 'color' && p.value === 'red' && p.when.length === 0 && !p.important
    )
    expect(exact, 'exact plan for color:red is in stylePlans').toBeDefined()

    // Userspace silent (green today): a static declaration warns nowhere.
    expect(result.diagnostics ?? [], 'userspace silent for static plan').toHaveLength(0)

    // RED HINGE: the opt-in compiler channel records the exact expected
    // lookup the diagnostics analysis predicted for this declaration.
    const opted = await compileCase(
      'ATM-DIAG-08',
      { logs: ['compiler'] } as unknown as Parameters<typeof compileCase>[1]
    )
    const compilerDiags = (
      opted as unknown as {
        compilerDiagnostics?: Array<{ code: string; message: string }>
      }
    ).compilerDiagnostics
    expect(
      compilerDiags,
      'compiler channel records the exact expected lookup'
    ).toBeDefined()
    expect(
      compilerDiags!.some(d => d.message.includes('color:red')),
      'compiler channel names the exact expected key color:red'
    ).toBe(true)
  },
}

export default spec
