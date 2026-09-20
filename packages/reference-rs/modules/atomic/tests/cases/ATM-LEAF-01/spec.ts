/**
 * Flat ternary extract station. Open tests scoop both arms; folded tests
 * compile the live arm only and name the dead arm in an info diagnostic.
 * Nested forms and undefined omission live in ATM-LEAF-02 and ATM-LEAF-03.
 */
import { expect } from 'vitest'
import { compileCase, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-LEAF-01',
  async verify(result) {
    expect(hasWant(result, 'bg', 'n300')).toBe(true)
    expect(hasWant(result, 'bg', 'n100')).toBe(true)
    expect(hasWant(result, 'color', 'white')).toBe(true)
    expect(hasWant(result, 'color', 'black')).toBe(false)
    // The dead-branch info rides the opt-in channel now (S6 E8-class
    // re-point); the default is silent.
    expect(result.diagnostics ?? []).toHaveLength(0)
    const opted = await compileCase('ATM-LEAF-01', { logs: ['compiler'] })
    expect(opted.compilerDiagnostics, 'opt-in channel populates').toBeDefined()
    const deads = (opted.compilerDiagnostics ?? []).filter(
      d => d.code === 'ATM-I-DEAD-BRANCH'
    )
    expect(deads).toHaveLength(1)
    expect(deads[0]!.severity).toBe('info')
    expect(deads[0]!.message).toContain("dead branch 'black'")
  },
}

export default spec
