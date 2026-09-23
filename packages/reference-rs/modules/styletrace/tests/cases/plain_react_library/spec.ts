/**
 * Station specification for plain_react_library.
 * Asserts a multi-file component library with zero Reference imports stays
 * out of the style-bearing surface, barrel re-exports included.
 * Expected surface is empty.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'plain_react_library',
  verify(result) {
    expect(result).toEqual([])
  },
}

export default spec
