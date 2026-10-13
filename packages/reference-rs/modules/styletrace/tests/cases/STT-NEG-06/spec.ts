/**
 * Station specification for STT-NEG-06.
 * Asserts a higher-order component applied to an argument that names no component emits one
 * STT-W-UNRESOLVED-HOC-ARGUMENT warning naming the export and the HOC, and the export is not
 * traced. The same HOC applied to Div still traces.
 */
import { expect } from 'vitest'
import { styletraceDiagnostics, type StyletraceCaseSpec } from '../../harness/helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'STT-NEG-06',
  verify(result) {
    expect(result).toEqual(['Padded'])
    const holes = styletraceDiagnostics(result).filter(
      d => d.code === 'STT-W-UNRESOLVED-HOC-ARGUMENT'
    )
    expect(holes).toHaveLength(1)
    expect(holes[0]?.file).toMatch(/index\.tsx$/)
    expect(holes[0]?.message).toContain('`Unresolved`')
    expect(holes[0]?.message).toContain('`withPad`')
  },
}

export default spec
