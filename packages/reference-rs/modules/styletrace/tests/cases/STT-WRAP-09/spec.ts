/**
 * Station specification for STT-WRAP-09.
 * Asserts a higher-order component whose returned component spreads StyleProps into its parameter
 * traces under each export it is applied at: a function HOC, an arrow HOC, a forwardRef product,
 * an inner function declaration, and a local forwarding component. A HOC applied to a component
 * with no StyleProps stays untraced.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../harness/helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'STT-WRAP-09',
  verify(result) {
    expect(result).toEqual([
      'FramedBox',
      'InnerBox',
      'PaddedBox',
      'RefBox',
      'WrappedPlain',
    ])
  },
}

export default spec
