/**
 * Station specification for STT-WRAP-14.
 * Asserts a chain of sixty-five declarations that reaches StyleProps past the depth guard leaves Chained untraced and
 * emits exactly one STT-W-TYPE-EXPANSION-LIMIT warning naming StyleProps, the depth limit and chain.tsx, while the
 * mutually recursive pair in loop.tsx traces Looped with no limit warning.
 */
import { expect } from 'vitest'
import { styletraceDiagnostics, type StyletraceCaseSpec } from '../../harness/helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'STT-WRAP-14',
  verify(result) {
    expect(result).toEqual(['Looped'])
    const limits = styletraceDiagnostics(result).filter(
      d => d.code === 'STT-W-TYPE-EXPANSION-LIMIT'
    )
    expect(limits).toHaveLength(1)
    expect(limits[0]?.file).toMatch(/chain\.tsx$/)
    expect(limits[0]?.message).toContain('`StyleProps`')
    expect(limits[0]?.message).toContain('at the depth limit')
  },
}

export default spec
