/**
 * Station specification for STT-BAR-08.
 * Asserts that an Object.assign compound mints a dotted name for each style-bearing member
 * (Tabs.Item, Tabs.Panel) under the exported name Tabs. The style-less Plain mints nothing,
 * and the unexported TabsRoot target emits nothing.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../harness/helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'STT-BAR-08',
  verify(result) {
    expect(result).toEqual(['Item', 'Panel', 'Tabs.Item', 'Tabs.Panel'])
  },
}

export default spec
