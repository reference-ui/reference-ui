/**
 * Station specification for STT-BAR-05.
 * Asserts a consumer re-exporting and wrapping a packaged barrel entrypoint
 * traces both the local wrapper and the package export.
 * Expected names are ConsumerStyleComponent and MyStyleComponent.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../harness/helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'STT-BAR-05',
  verify(result) {
    expect(result).toEqual(['ConsumerStyleComponent', 'MyStyleComponent'])
  },
}

export default spec
