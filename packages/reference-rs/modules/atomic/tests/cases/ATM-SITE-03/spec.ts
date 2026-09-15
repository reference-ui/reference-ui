/**
 * recipe() call-site extract station. base, variant, and compoundVariants
 * css leaves become wants. Closed @layer recipes classes are ATM-RECIPE-*.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-03',
  verify(result) {
    expect(hasWant(result, 'fontWeight', 'bold')).toBe(true)
    expect(hasWant(result, 'bg', 'blue')).toBe(true)
    expect(hasWant(result, 'color', 'white')).toBe(true)
    expect(hasWant(result, 'border', '1px solid')).toBe(true)
    expect(hasWant(result, 'opacity', '0.9')).toBe(true)
    expect(result.diagnostics).toHaveLength(0)
  },
}

export default spec
