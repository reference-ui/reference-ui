/**
 * Station specification for named_barrel.
 * Asserts a wrapper re-exported through a local named barrel stays traced.
 * Expected name is MyStyleComponent.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'named_barrel',
  verify(result) {
    expect(result).toEqual(['MyStyleComponent'])
  },
}

export default spec
