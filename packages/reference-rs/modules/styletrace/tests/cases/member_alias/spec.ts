/**
 * Station specification for member_alias.
 * Asserts compound-member assignments mint dotted hosts for traced wrappers:
 * local targets (Tabs.Panel, Tabs.Item) plus an imported cross-module target
 * (Tabs.Section), while the alias onto style-less Plain stays silent.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'member_alias',
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
