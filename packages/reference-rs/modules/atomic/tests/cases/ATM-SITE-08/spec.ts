/**
 * Styletrace gating case. Div is a Reference import and extracts.
 * Foo is a local component without StyleProps and is never a host, even
 * when it authors known style props: no PascalCase matcher. Untraced, its
 * props lower under own (styling plan S3).
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../harness/helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-08',
  verify(result) {
    expect(hasWant(result, 'mt', '2r')).toBe(true)
    expect(hasWant(result, 'mt', '4r')).toBe(true)
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(result.diagnostics).toEqual([])
  },
}

export default spec
