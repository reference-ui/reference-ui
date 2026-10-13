/**
 * Station specification for STT-WRAP-05.
 * Asserts wrappers forwarding into non-Reference UI stay out of the
 * style-bearing surface: open prop boundaries with no primitive downstream.
 * Expected surface is empty.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../harness/helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'STT-WRAP-05',
  verify(result) {
    expect(result).toEqual([])
  },
}

export default spec
