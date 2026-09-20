/**
 * Station specification for direct_wrapper.
 * Asserts that a local Div wrapper exposing StyleProps is traced as Card.
 * The body-destructured twin (BodyCard: `const { color } = props`) traces too.
 * The fallback twin (FallbackCard: `color={color ?? "red"}`) traces additively.
 * Non-style helpers in the same file must not appear.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'direct_wrapper',
  verify(result) {
    expect(result).toEqual(['BodyCard', 'Card', 'FallbackCard'])
  },
}

export default spec
