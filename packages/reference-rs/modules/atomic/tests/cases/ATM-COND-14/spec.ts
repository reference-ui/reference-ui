/**
 * Nested arbitrary & selectors, comma-separated selector lists, and attribute quotes.
 * Pins the `:last-child` descendant, the `:not()` selector list, and the quoted `&` attribute.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../harness/helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-COND-14',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toMatch(/:last-child\s+\.divider/)
    expect(sheet).toMatch(/:not\(:first-child\),\s*\S+:only-child/)
    expect(sheet).toContain('[data-x="a & b"]')
  },
}

export default spec
