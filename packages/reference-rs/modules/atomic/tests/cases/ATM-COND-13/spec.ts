/**
 * Breakpoint range conditions lower to bounded queries.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-COND-13',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain('@container (max-width: 767.98px)')
    expect(sheet).toContain('@container (min-width: 768px) and (max-width: 1023.98px)')
    expect(sheet).toContain('@container (min-width: 640px) and (max-width: 1023.98px)')
    expect(
      result.diagnostics.some(
        d => d.severity === 'warning' && d.message.includes('watDown')
      )
    ).toBe(true)
    expect(sheet).not.toContain('watDown')
  },
}

export default spec
