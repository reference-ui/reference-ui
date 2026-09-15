/**
 * Border zero/whole station. `0` / `0px` become width 0px. `none`, `inherit`,
 * and `borders.card` stay a single border atom.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SHORT-03',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain('border-width: 0px;')
    expect(sheet).toContain('border: none;')
    expect(sheet).toContain('border: inherit;')
    expect(sheet).toContain('border: borders.card;')
    expect(sheet).not.toContain('var(--borders-card)')
    expect(sheet.toLowerCase()).not.toContain('currentcolor')
  },
}

export default spec
