/**
 * Null-const station (§4). A const bound to `null` is a hole, not a
 * dynamic value: same-file and imported nulls strip silently, exactly
 * like a literal null, with static siblings kept.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-82',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain('padding: 4px;')
    expect(sheet).toContain('margin: 2px;')
    expect(sheet).not.toContain('color:')
    expect(result.css?.classes).not.toHaveProperty('color:null')
    expect(result.diagnostics).toEqual([])
  },
}

export default spec
