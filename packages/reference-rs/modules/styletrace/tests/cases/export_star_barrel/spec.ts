/**
 * Station specification for export_star_barrel.
 * Asserts export-star barrels preserve the wrapped Card export.
 * The barrel itself is not a component name.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'export_star_barrel',
  verify(result) {
    expect(result).toEqual(['Card'])
  },
}

export default spec
