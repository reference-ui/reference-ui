/**
 * Brace-interpolation station. Token segments inside composite border and
 * shadow values expand to var() references; an unterminated brace stays
 * raw inside its string and warns.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-TOKEN-08',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain('var(--colors-gray-800)')
    expect(sheet).toContain('box-shadow: 0 1px 2px var(--colors-gray-200);')
    expect(sheet).toContain('content: "{oops";')
    const messages = result.diagnostics.map(d => d.message)
    expect(messages.filter(m => m.includes('unterminated'))).toHaveLength(1)
  },
}

export default spec
