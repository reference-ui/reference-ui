/**
 * Station specification for STT-WRAP-07.
 * Asserts style props propagate through Card → Surface → Div.
 * Both exported wrappers remain on the traced surface.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../harness/helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'STT-WRAP-07',
  verify(result) {
    expect(result).toEqual(['Card', 'Surface'])
  },
}

export default spec
