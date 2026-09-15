/**
 * Keyword passthrough station. `transparent` / `currentColor` / `black` /
 * `white` stay raw CSS, never `var(--colors-transparent)`.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-TOKEN-04',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain('color: transparent;')
    expect(sheet).toContain('background: currentColor;')
    expect(sheet).toContain('border-color: black;')
    expect(sheet).toContain('outline-color: white;')
    expect(sheet).not.toContain('var(--colors-transparent)')
    expect(sheet).not.toContain('var(--colors-currentColor)')
    expect(sheet).not.toContain('var(--colors-black)')
    expect(sheet).not.toContain('var(--colors-white)')
    expect(result.diagnostics).toEqual([])
  },
}

export default spec
