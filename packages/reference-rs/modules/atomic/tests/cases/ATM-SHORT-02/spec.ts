/**
 * outline shorthand station. Width and style longhands emit; default
 * outline color is never synthesized, so sibling outlineColor wins.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SHORT-02',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain('outline-width: 1px;')
    expect(sheet).toContain('outline-style: solid;')
    expect(sheet).toContain('outline-color: var(--colors-blue-600);')
    expect(sheet.toLowerCase()).not.toContain('currentcolor')
  },
}

export default spec
