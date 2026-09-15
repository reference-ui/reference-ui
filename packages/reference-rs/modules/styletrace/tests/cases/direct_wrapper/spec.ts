/**
 * Station specification for direct_wrapper.
 * Asserts that a local Div wrapper exposing StyleProps is traced as Card.
 * Non-style helpers in the same file must not appear.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'direct_wrapper',
  verify(result) {
    expect(result).toEqual(['Card'])
  },
}

export default spec
