/**
 * Station specification for forward_ref_wrapper.
 * Asserts forwardRef wrappers with StyleProps generics are traced as Card.
 * The inner Div is not a public export.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'forward_ref_wrapper',
  verify(result) {
    expect(result).toEqual(['Card'])
  },
}

export default spec
