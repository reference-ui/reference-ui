/**
 * Station specification for STT-BAR-10.
 * Asserts that type-only re-exports (export type { ... } from, inline export { type ... }, and a
 * type-only import re-exported by name) mint no component name, while the value re-export
 * export { Card as Value } from still mints Value.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../harness/helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'STT-BAR-10',
  verify(result) {
    expect(result).toEqual(['Card', 'Value'])
  },
}

export default spec
