/**
 * Station specification for STT-WRAP-02.
 * Asserts forwardRef wrappers with StyleProps generics are traced as Card.
 * The inner Div is not a public export.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../harness/helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'STT-WRAP-02',
  verify(result) {
    expect(result).toEqual(['Card'])
  },
}

export default spec
