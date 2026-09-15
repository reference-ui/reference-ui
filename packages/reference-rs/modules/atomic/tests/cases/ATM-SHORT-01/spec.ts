/**
 * borderBottom shorthand station. Width and style longhands emit;
 * currentColor is never synthesized, so sibling borderColor wins.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SHORT-01',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain('border-bottom-width: 3px;')
    expect(sheet).toContain('border-bottom-style: solid;')
    expect(sheet).toContain('border-color: var(--colors-gray-800);')
    expect(sheet.toLowerCase()).not.toContain('currentcolor')
  },
}

export default spec
