/**
 * Station specification for direct_style_pipeline.
 * Asserts the styled css/box pipeline traces Panel without a primitive wrapper.
 * The object-arg twin (ObjPanel: `css({ color })`) traces additively.
 * The helper joinClassName is not a component export.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'direct_style_pipeline',
  verify(result) {
    expect(result).toEqual(['ObjPanel', 'Panel'])
  },
}

export default spec
