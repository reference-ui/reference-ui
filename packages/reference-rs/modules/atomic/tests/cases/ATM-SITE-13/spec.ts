/**
 * Missing-graph station (ATM-SITE-13, RS-5). A hostless `<Foo mt="4r" />`
 * extracts zero wants, zero classes, zero plans, and reports one
 * missing-graph error at the tag's file/line/column. The styleless
 * sibling file adds no diagnostics.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-13',
  verify(result) {
    expect(result.wants ?? []).toHaveLength(0)
    expect(result.css?.classes ?? {}).toEqual({})
    expect(result.runtime.stylePlans).toHaveLength(0)

    expect(result.diagnostics).toHaveLength(1)
    const [diag] = result.diagnostics
    expect(diag!.severity).toBe('error')
    expect(diag!.message).toContain('missing primitive graph')
    expect(diag!.message).toContain('<Foo>')
    expect(diag!.file).toMatch(/input\/src\/App\.tsx$/)
    expect(diag!.line).toBe(2)
    expect(diag!.column).toBe(10)
  },
}

export default spec
