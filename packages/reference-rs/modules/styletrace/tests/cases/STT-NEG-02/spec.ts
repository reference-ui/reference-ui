/**
 * Station specification for STT-NEG-02.
 * Asserts an unparsable sibling is skipped while Card still traces.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../harness/helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'STT-NEG-02',
  verify(result) {
    expect(result).toEqual(['Card'])
  },
}

export default spec
