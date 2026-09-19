/**
 * Flat ternary extract station. Open tests scoop both arms; folded tests
 * compile the live arm only and name the dead arm in an info diagnostic.
 * Nested forms and undefined omission live in ATM-LEAF-02 and ATM-LEAF-03.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-LEAF-01',
  verify(result) {
    expect(hasWant(result, 'bg', 'n300')).toBe(true)
    expect(hasWant(result, 'bg', 'n100')).toBe(true)
    expect(hasWant(result, 'color', 'white')).toBe(true)
    expect(hasWant(result, 'color', 'black')).toBe(false)
    const diagnostics = result.diagnostics ?? []
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]!.severity).toBe('info')
    expect(diagnostics[0]!.code).toBe('ATM-I-DEAD-BRANCH')
    expect(diagnostics[0]!.message).toContain("dead branch 'black'")
  },
}

export default spec
