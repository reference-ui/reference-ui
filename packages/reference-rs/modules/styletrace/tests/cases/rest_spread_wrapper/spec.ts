/**
 * Station specification for rest_spread_wrapper.
 * Asserts rest-spread forwarding still exposes Card as style-bearing.
 * The body-destructured twin (BodyRestCard: `const { id, ...rest } = props`)
 * traces too. Peeled non-style props do not remove the wrapper from the surface.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'rest_spread_wrapper',
  verify(result) {
    expect(result).toEqual(['BodyRestCard', 'Card'])
  },
}

export default spec
