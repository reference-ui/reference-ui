/**
 * Station specification for STT-WRAP-04.
 * Asserts local re-exports of a package wrapper stay on the traced surface.
 * Expected names are AppCard and PackageCard.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../harness/helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'STT-WRAP-04',
  verify(result) {
    expect(result).toEqual(['AppCard', 'PackageCard'])
  },
}

export default spec
