/**
 * Station specification for STT-PKG-02.
 * Asserts a multi-file component library with zero Reference imports stays
 * out of the style-bearing surface, barrel re-exports included.
 * Expected surface is empty.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../harness/helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'STT-PKG-02',
  verify(result) {
    expect(result).toEqual([])
  },
}

export default spec
