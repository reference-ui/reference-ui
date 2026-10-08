/**
 * Category-prefixed token station. `colors.blue.600` / `radii.md` /
 * `fonts.mono` become canonical custom properties against the lib fixture.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-TOKEN-01',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain('color: var(--colors-blue-600);')
    expect(sheet).toContain('border-radius: var(--radii-md);')
    expect(sheet).toContain('font-family: var(--fonts-mono);')
    expect(result.diagnostics).toEqual([])
  },
}

export default spec
