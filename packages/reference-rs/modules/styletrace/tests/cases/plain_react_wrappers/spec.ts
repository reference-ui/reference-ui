/**
 * Station specification for plain_react_wrappers.
 * Asserts wrappers forwarding into non-Reference UI stay out of the
 * style-bearing surface: open prop boundaries with no primitive downstream.
 * Expected surface is empty.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'plain_react_wrappers',
  verify(result) {
    expect(result).toEqual([])
  },
}

export default spec
