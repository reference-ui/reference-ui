/**
 * Station specification for STT-PIPE-02.
 * Asserts entries forwarding into a package wrapper trace under their own
 * names while the package export itself is never emitted.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../harness/helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'STT-PIPE-02',
  verify(result) {
    expect(result).toEqual(['Card', 'Other'])
  },
}

export default spec
