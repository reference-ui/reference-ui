/**
 * Station specification for STT-WRAP-01.
 * Asserts that a local Div wrapper exposing StyleProps is traced as Card.
 * The body-destructured twin (BodyCard: `const { color } = props`) traces too.
 * The fallback twin (FallbackCard: `color={color ?? "red"}`) traces additively.
 * Non-style helpers in the same file must not appear.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../harness/helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'STT-WRAP-01',
  verify(result) {
    expect(result).toEqual(['BodyCard', 'Card', 'FallbackCard'])
  },
}

export default spec
