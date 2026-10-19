/**
 * Container-query conditions without a container root in globalCss emit a diagnostic.
 * The warning names both `container-type` and `@container`; no `@container` rule is asserted.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../harness/helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-COND-15',
  verify(result) {
    expect(
      result.diagnostics.some(
        d =>
          d.severity === 'warning' &&
          d.message.includes('container-type') &&
          d.message.includes('@container')
      )
    ).toBe(true)
  },
}

export default spec
