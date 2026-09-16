/**
 * Nested arbitrary & selectors, comma-separated selector lists, and attribute quotes.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

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
