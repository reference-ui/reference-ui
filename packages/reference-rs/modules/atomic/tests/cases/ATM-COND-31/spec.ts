/**
 * Raw pseudo-element (raw arm). `&::after` lowers like
 * the `_after` dialect, single-level `&:hover::before` compounds keep
 * pseudo-class before pseudo-element, and comma pseudo-element lists emit.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../harness/helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-COND-31',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain('::after { color: red; }')
    expect(sheet).toContain(':hover::before { color: blue; }')
    expect(sheet).toContain('::before')
    expect(sheet).toContain('::after { color: green; }')
    expect(result.diagnostics).toEqual([])
  },
}

export default spec
