/**
 * Station specification for STT-PKG-03.
 * Asserts package.json subpath exports still resolve style-bearing wrappers.
 * Expected names are AppCard and PackageCard.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../harness/helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'STT-PKG-03',
  verify(result) {
    expect(result).toEqual(['AppCard', 'PackageCard'])
  },
}

export default spec
