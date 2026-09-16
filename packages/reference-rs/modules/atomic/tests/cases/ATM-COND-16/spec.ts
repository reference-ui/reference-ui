/**
 * Boolean container utility and named-container r query lowering.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-COND-16',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain('container-type: inline-size;')
    expect(sheet).not.toMatch(/container-type:\s*inline-size;\s*container-name:/)
    expect(sheet).toContain('@container card (min-width: 768px)')
  },
}

export default spec
