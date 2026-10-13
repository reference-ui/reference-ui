/**
 * Station specification for STT-WRAP-03.
 * Asserts factory-created icons and their wrappers stay on the style-bearing surface.
 * Expected names are StarIcon and ToolbarIcon.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../harness/helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'STT-WRAP-03',
  verify(result) {
    expect(result).toEqual(['StarIcon', 'ToolbarIcon'])
  },
}

export default spec
