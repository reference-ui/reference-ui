/**
 * Station specification for STT-PIPE-01.
 * Asserts the styled css/box pipeline traces Panel without a primitive wrapper.
 * The object-arg twin (ObjPanel: `css({ color })`) traces additively.
 * The fallback twin (FallbackPanel: `css({ color: color ?? "red" })`) traces too.
 * The helper joinClassName is not a component export.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../harness/helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'STT-PIPE-01',
  verify(result) {
    expect(result).toEqual(['FallbackPanel', 'ObjPanel', 'Panel'])
  },
}

export default spec
