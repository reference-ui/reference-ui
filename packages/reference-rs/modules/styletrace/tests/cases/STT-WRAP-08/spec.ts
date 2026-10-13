/**
 * Station specification for STT-WRAP-08.
 * Asserts that a local style-bearing wrapper exported through a const alias, React.memo,
 * React.forwardRef, the imported memo and forwardRef, and nested memo(forwardRef(...)) traces
 * under each export name. The unexported CardBase emits nothing, and a style-less wrapper
 * exported through React.memo (PlainMemo) mints no name.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../harness/helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'STT-WRAP-08',
  verify(result) {
    expect(result).toEqual([
      'Card',
      'ImportMemoCard',
      'ImportRefCard',
      'MemoCard',
      'NestedCard',
      'RefCard',
    ])
  },
}

export default spec
