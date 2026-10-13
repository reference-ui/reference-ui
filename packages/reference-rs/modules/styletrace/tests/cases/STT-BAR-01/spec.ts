/**
 * Station specification for STT-BAR-01.
 * Asserts export-star barrels preserve the wrapped Card export.
 * The barrel itself is not a component name.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../harness/helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'STT-BAR-01',
  verify(result) {
    expect(result).toEqual(['Card'])
  },
}

export default spec
