/**
 * Station specification for STT-BAR-11.
 * Asserts a namespace re-export (export * as UI from a package) traces each reached component
 * under the dotted name UI.<name>, and the bare names do not leak from the barrel. The package's
 * Plain component exposes no StyleProps and mints nothing.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../harness/helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'STT-BAR-11',
  verify(result) {
    expect(result).toEqual(['UI.Button', 'UI.Card'])
  },
}

export default spec
