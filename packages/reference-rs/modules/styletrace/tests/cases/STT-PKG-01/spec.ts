/**
 * Station specification for STT-PKG-01.
 * Asserts default-export package components are traced under both local names.
 * Expected names are AppCard and PackageCard.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../harness/helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'STT-PKG-01',
  verify(result) {
    expect(result).toEqual(['AppCard', 'PackageCard'])
  },
}

export default spec
