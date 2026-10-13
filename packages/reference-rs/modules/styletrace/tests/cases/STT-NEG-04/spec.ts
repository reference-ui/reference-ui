/**
 * Station specification for STT-NEG-04.
 * Asserts one unparsable file, reached as an entry and through an import, yields exactly one
 * STT-W-SKIPPED-FILE warning naming it, while its sibling Card still traces.
 */
import { expect } from 'vitest'
import { styletraceDiagnostics, type StyletraceCaseSpec } from '../../harness/helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'STT-NEG-04',
  verify(result) {
    expect(result).toEqual(['Card'])
    const skips = styletraceDiagnostics(result).filter(d => d.code === 'STT-W-SKIPPED-FILE')
    expect(skips.map(d => d.file)).toHaveLength(1)
    expect(skips[0]?.file).toMatch(/broken\.tsx$/)
  },
}

export default spec
