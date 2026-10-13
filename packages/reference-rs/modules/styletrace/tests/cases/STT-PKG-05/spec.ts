/**
 * Station specification for STT-PKG-05.
 * Asserts a default re-export from a package mints the re-exported component's own name
 * (DefaultCard), never the literal `default`, while a named alias of the same default
 * (export { default as PackageCard }) still mints PackageCard.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../harness/helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'STT-PKG-05',
  verify(result) {
    expect(result).toEqual(['DefaultCard', 'PackageCard'])
  },
}

export default spec
