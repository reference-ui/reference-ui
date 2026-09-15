/**
 * Station specification for reexport_alias.
 * Asserts the traced name is the exported alias Panel, not the local binding.
 * Style props still flow through the aliased wrapper.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'reexport_alias',
  verify(result) {
    expect(result).toEqual(['Panel'])
  },
}

export default spec
