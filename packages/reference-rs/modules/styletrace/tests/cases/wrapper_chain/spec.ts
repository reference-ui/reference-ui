/**
 * Station specification for wrapper_chain.
 * Asserts style props propagate through Card → Surface → Div.
 * Both exported wrappers remain on the traced surface.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'wrapper_chain',
  verify(result) {
    expect(result).toEqual(['Card', 'Surface'])
  },
}

export default spec
