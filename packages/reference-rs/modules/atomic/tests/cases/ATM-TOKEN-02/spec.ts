/**
 * Bare-color station. `blue.600` / `gray.800` on color props become
 * `--colors-…`. `mt="blue.600"` stays raw and warns.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-TOKEN-02',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain('color: var(--colors-blue-600);')
    expect(sheet).toContain('background: var(--colors-gray-800);')
    expect(sheet).toContain('margin-top: blue.600;')
    expect(sheet).not.toContain('margin-top: var(--colors-blue-600);')
    expect(result.diagnostics.length).toBeGreaterThanOrEqual(1)
    expect(result.diagnostics.some(d => d.message.includes('blue.600'))).toBe(
      true
    )
  },
}

export default spec
