/**
 * Station specification for STT-PKG-04.
 * A top-level `types` field must not shadow a package's `exports` source entry:
 * the wrapper in index.tsx traces, so AppCard and PackageCard are both expected.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../harness/helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'STT-PKG-04',
  verify(result) {
    expect(result).toEqual(['AppCard', 'PackageCard'])
  },
}

export default spec
