/**
 * Station specification for STT-BAR-07.
 * Asserts the traced name is the exported alias Panel, not the local binding.
 * Style props still flow through the aliased wrapper.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../harness/helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'STT-BAR-07',
  verify(result) {
    expect(result).toEqual(['Panel'])
  },
}

export default spec
