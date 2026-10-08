/**
 * Station specification for named_barrel_package.
 * Asserts a consumer re-exporting and wrapping a packaged barrel entrypoint
 * traces both the local wrapper and the package export.
 * Expected names are ConsumerStyleComponent and MyStyleComponent.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'named_barrel_package',
  verify(result) {
    expect(result).toEqual(['ConsumerStyleComponent', 'MyStyleComponent'])
  },
}

export default spec
