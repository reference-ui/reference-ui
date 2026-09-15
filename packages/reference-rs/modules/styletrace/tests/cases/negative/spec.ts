/**
 * Station specification for negative.
 * Asserts primitives rendered without public style props are not traced.
 * The station proves the closed surface, not a missing fixture.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'negative',
  verify(result) {
    expect(result).toEqual([])
  },
}

export default spec
