/**
 * Station specification for namespace_import.
 * Asserts namespace-imported primitives still count as style-bearing targets.
 * Card is the exported wrapper name.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'namespace_import',
  verify(result) {
    expect(result).toEqual(['Card'])
  },
}

export default spec
