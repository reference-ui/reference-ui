/**
 * Station specification for export_star_package.
 * Asserts package-level export-star barrels expose the wrapped Card as PackageCard.
 * Expected names are AppCard and PackageCard.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'export_star_package',
  verify(result) {
    expect(result).toEqual(['AppCard', 'PackageCard'])
  },
}

export default spec
