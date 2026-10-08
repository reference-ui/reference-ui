/**
 * Rhythm multiplier station. Integer `2r` and decimal `0.5r` lower to
 * `calc(N * var(--spacing-root))`.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-RHYTHM-02',
  verify(result) {
    expect(result.stylesheet).toContain('margin-bottom: calc(2 * var(--spacing-root));')
    expect(result.stylesheet).toContain('padding-top: calc(0.5 * var(--spacing-root));')
  },
}

export default spec
