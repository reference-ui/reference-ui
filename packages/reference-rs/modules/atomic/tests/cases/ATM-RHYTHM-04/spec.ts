/**
 * Multi-value rhythm station. `1r 2r` and `1px solid 1/3r` keep non-rhythm
 * tokens in place while each `r` token becomes calc/var.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-RHYTHM-04',
  verify(result) {
    expect(result.stylesheet).toContain(
      'var(--spacing-root) calc(2 * var(--spacing-root))'
    )
    expect(result.stylesheet).toContain('1px solid calc(var(--spacing-root) / 3)')
    expect(result.stylesheet).toContain('10px auto')
  },
}

export default spec
