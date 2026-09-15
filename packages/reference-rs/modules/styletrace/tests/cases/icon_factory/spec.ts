/**
 * Station specification for icon_factory.
 * Asserts factory-created icons and their wrappers stay on the style-bearing surface.
 * Expected names are StarIcon and ToolbarIcon.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'icon_factory',
  verify(result) {
    expect(result).toEqual(['StarIcon', 'ToolbarIcon'])
  },
}

export default spec
