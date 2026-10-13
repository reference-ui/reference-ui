/**
 * Silence side of ATM-W-UNKNOWN-TOKEN. CSS keywords the prop accepts, bare
 * numbers, lengths, real tokens, and names on props outside the length
 * categories all pass without a diagnostic.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../harness/helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-TOKEN-25',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain('padding: auto;')
    expect(sheet).toContain('padding: 2px;')
    expect(sheet).toContain('width: fit-content;')
    expect(sheet).toContain('font-size: larger;')
    expect(sheet).toContain('border-radius: var(--radii-sm);')
    expect(sheet).toContain('font-family: upFont;')
    expect(result.diagnostics).toEqual([])
  },
}

export default spec
