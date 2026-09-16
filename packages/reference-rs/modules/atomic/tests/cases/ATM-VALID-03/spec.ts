/**
 * Escaping-boundary station. The class selector escapes `.`, `(`, `)`,
 * and `/` while the declaration value stays raw in both rules.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-VALID-03',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain('.\\@reference-ui\\/lib__c_ghost\\.white')
    expect(sheet).toContain('color: ghost.white;')
    expect(sheet).not.toContain('ghost\\.white;')
    expect(sheet).toContain('.\\@reference-ui\\/lib__c_oklch\\(0\\.5_0\\.1_200\\)')
    expect(sheet).toContain('color: oklch(0.5 0.1 200);')
    const messages = result.diagnostics.map(d => d.message)
    expect(messages.filter(m => m.includes('ghost.white'))).toHaveLength(1)
  },
}

export default spec
