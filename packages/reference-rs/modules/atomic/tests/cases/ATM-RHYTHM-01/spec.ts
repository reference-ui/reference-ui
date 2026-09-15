/**
 * Base rhythm station. `1r` lowers to `var(--spacing-root)`. Multipliers,
 * fractions, and authored negatives live in ATM-RHYTHM-02/03/05.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-RHYTHM-01',
  verify(result) {
    expect(result.stylesheet).toContain('margin-top: var(--spacing-root);')
  },
}

export default spec
