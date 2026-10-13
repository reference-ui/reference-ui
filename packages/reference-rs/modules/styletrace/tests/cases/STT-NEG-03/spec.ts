/**
 * Station specification for STT-NEG-03.
 * Asserts a style-props helper called with no arguments is ignored, not a crash.
 * Probe's argless splitCssProps() reads no style signal, so Probe is not traced
 * and the trace raises no error diagnostic. Card still traces beside it.
 */
import { expect } from 'vitest'
import { styletraceDiagnostics, type StyletraceCaseSpec } from '../../harness/helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'STT-NEG-03',
  verify(result) {
    expect(result).toEqual(['Card'])
    const errors = styletraceDiagnostics(result).filter(
      diagnostic => diagnostic.severity === 'error'
    )
    expect(errors).toEqual([])
  },
}

export default spec
