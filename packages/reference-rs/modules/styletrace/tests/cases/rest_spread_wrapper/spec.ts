/**
 * Station specification for rest_spread_wrapper.
 * Asserts rest-spread forwarding still exposes Card as style-bearing.
 * Peeled non-style props do not remove the wrapper from the surface.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'rest_spread_wrapper',
  verify(result) {
    expect(result).toEqual(['Card'])
  },
}

export default spec
