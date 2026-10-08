/**
 * Station specification for entry_scope.
 * Asserts entries forwarding into a package wrapper trace under their own
 * names while the package export itself is never emitted.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'entry_scope',
  verify(result) {
    expect(result).toEqual(['Card', 'Other'])
  },
}

export default spec
