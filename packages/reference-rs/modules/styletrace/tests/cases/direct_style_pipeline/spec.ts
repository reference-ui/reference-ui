/**
 * Station specification for direct_style_pipeline.
 * Asserts the styled css/box pipeline traces Panel without a primitive wrapper.
 * The helper joinClassName is not a component export.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'direct_style_pipeline',
  verify(result) {
    expect(result).toEqual(['Panel'])
  },
}

export default spec
