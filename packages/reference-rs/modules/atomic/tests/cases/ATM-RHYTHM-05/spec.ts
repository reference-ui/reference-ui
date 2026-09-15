/**
 * Negative rhythm station. Authored `-1r` / `-2r` extract and compile to
 * negative calc declarations without syntax errors.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-RHYTHM-05',
  verify(result) {
    expect(hasWant(result, 'marginTop', '-1r')).toBe(true)
    expect(hasWant(result, 'left', '-2r')).toBe(true)
    expect(result.stylesheet).toContain('margin-top: calc(-1 * var(--spacing-root));')
    expect(result.stylesheet).toContain('left: calc(-2 * var(--spacing-root));')
  },
}

export default spec
