/**
 * Opacity-modifier station. Slash opacity on color tokens becomes
 * `color-mix(in srgb, var(--colors-…) N%, transparent)`.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-TOKEN-03',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain(
      'background: color-mix(in srgb, var(--colors-blue-600) 50%, transparent);'
    )
    expect(sheet).toContain(
      'color: color-mix(in srgb, var(--colors-red-500) 25%, transparent);'
    )
    expect(result.diagnostics).toEqual([])
  },
}

export default spec
