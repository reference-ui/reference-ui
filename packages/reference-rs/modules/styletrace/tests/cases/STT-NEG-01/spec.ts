/**
 * Station specification for STT-NEG-01.
 * Asserts primitives rendered without public style props are not traced.
 * The station proves the closed surface, not a missing fixture.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../harness/helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'STT-NEG-01',
  verify(result) {
    expect(result).toEqual([])
  },
}

export default spec
