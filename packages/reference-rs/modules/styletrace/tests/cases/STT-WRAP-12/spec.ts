/**
 * Station specification for STT-WRAP-12.
 * Asserts components typed through same-named generic forwarding (Forward<T> = Wrap<T>, and an infer V
 * passed into a parameter V) trace as Card and Badge; before the fix both resolved against themselves and overflowed the stack.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../harness/helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'STT-WRAP-12',
  verify(result) {
    expect(result).toEqual(['Badge', 'Card'])
  },
}

export default spec
