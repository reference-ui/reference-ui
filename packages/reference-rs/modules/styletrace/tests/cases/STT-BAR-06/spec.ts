/**
 * Station specification for STT-BAR-06.
 * Asserts namespace-imported primitives still count as style-bearing targets.
 * Card is the exported wrapper name.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../harness/helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'STT-BAR-06',
  verify(result) {
    expect(result).toEqual(['Card'])
  },
}

export default spec
