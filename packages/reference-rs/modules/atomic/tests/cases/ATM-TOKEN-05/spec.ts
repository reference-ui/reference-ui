/**
 * Custom BaseSystem ingest station. Declared `colors.brand` resolves from
 * the passed dump. Lib-fixture `blue.600` is unknown here: pass through plus
 * warning. Do not invent tokens.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-TOKEN-05',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain('color: var(--colors-brand);')
    expect(sheet).toContain('--colors-brand: red;')
    expect(sheet).toContain('[data-panda-theme=dark]')
    expect(sheet).toContain('--colors-brand: navy;')
    expect(sheet).toContain('background: blue.600;')
    expect(sheet).not.toContain('background: var(--colors-blue-600);')
    expect(sheet).not.toContain('--colors-blue-600:')
    expect(result.diagnostics.length).toBeGreaterThanOrEqual(1)
    expect(
      result.diagnostics.some(
        d => d.severity === 'warning' && d.message.includes('blue.600')
      )
    ).toBe(true)
  },
}

export default spec
