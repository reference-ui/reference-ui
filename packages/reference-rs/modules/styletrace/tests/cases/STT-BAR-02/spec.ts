/**
 * Station specification for STT-BAR-02.
 * Asserts package-level export-star barrels expose the wrapped Card as PackageCard.
 * Expected names are AppCard and PackageCard.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../harness/helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'STT-BAR-02',
  verify(result) {
    expect(result).toEqual(['AppCard', 'PackageCard'])
  },
}

export default spec
