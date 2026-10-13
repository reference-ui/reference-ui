/**
 * Station specification for STT-BAR-04.
 * Asserts a wrapper re-exported through a local named barrel stays traced.
 * Expected name is MyStyleComponent.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../harness/helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'STT-BAR-04',
  verify(result) {
    expect(result).toEqual(['MyStyleComponent'])
  },
}

export default spec
