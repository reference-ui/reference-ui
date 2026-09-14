/**
 * Rhythm lowering station. Integer, multiplier, fractional, and negative
 * r units emit the exact calc formulas. Class keys for fractions must exist.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-RHYTHM-05',
  ids: ['ATM-RHYTHM-05', 'ATM-RHYTHM-03'],
  verify(result) {
    expect(result.stylesheet).toContain('margin-top: var(--spacing-root);')
    expect(result.stylesheet).toContain('margin-bottom: calc(2 * var(--spacing-root));')
    expect(result.stylesheet).toContain('padding-top: calc(0.5 * var(--spacing-root));')
    expect(result.stylesheet).toContain('padding-bottom: calc(var(--spacing-root) / 3);')
    expect(result.css?.classes?.['pb:1/3r']).toBeDefined()
    expect(result.css?.classes?.['gap:2/3r']).toBeDefined()
    expect(hasWant(result, 'marginTop', '-1r')).toBe(true)
    expect(hasWant(result, 'left', '-2r')).toBe(true)
  },
}

export default spec
