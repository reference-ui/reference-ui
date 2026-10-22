/**
 * Station specification for STT-WRAP-15.
 * Asserts a body re-destructure of an object-pattern parameter's rest binding carries StyleProps into a primitive,
 * so the forwardRef wrapper Forwarded and the plain function Plain trace beside the direct-spread control Direct.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../harness/helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'STT-WRAP-15',
  verify(result) {
    expect(result).toEqual(['Direct', 'Forwarded', 'Plain'])
  },
}

export default spec
