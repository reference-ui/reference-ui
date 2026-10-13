/**
 * Station specification for STT-BAR-03.
 * Asserts compound-member assignments mint dotted hosts for traced wrappers:
 * local targets (Tabs.Panel, Tabs.Item) plus an imported cross-module target
 * (Tabs.Section), while the alias onto style-less Plain stays silent.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../harness/helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'STT-BAR-03',
  verify(result) {
    expect(result).toEqual([
      'Item',
      'Panel',
      'Section',
      'Tabs.Item',
      'Tabs.Panel',
      'Tabs.Section',
    ])
  },
}

export default spec
