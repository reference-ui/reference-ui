/**
 * Station specification for STT-BAR-09.
 * Asserts that a compound member assigned onto a local binding mints its dotted name under the
 * exported alias (Tabs.Item) and not the local binding (TabsRoot.Item), which is unexported.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../harness/helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'STT-BAR-09',
  verify(result) {
    expect(result).toEqual(['Item', 'Tabs.Item'])
  },
}

export default spec
