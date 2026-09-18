/**
 * Global sibling-distribution station (ATM-LAYER-09, RS-11). `&`
 * substitution in the global walker distributes over comma members with
 * `:is()` around members that contain a combinator, so `'& ~ &'` nests
 * match siblings instead of every first child.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-LAYER-09',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain('body > p, body > ul { margin: 0 }')
    expect(sheet).toContain(
      ':is(body > p) ~ :is(body > p), :is(body > ul) ~ :is(body > ul) { margin-top: 10px }',
    )
    expect(sheet).toContain('.ref-a .ref-kid, .ref-b .ref-kid { color: red }')
    expect(sheet).toContain('.ref-c ~ .ref-c, .ref-d ~ .ref-d { margin-top: 5px }')
    expect(sheet).toContain(
      ':is(.ref-stack > p) ~ :is(.ref-stack > p) { margin-top: 8px }',
    )
    expect(sheet).not.toContain('body > ul ~ body > ul')
    expect(result.diagnostics).toEqual([])
  },
}

export default spec
