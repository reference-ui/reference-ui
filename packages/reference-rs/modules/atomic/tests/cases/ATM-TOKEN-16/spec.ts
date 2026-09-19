/**
 * Bare-value station (§11). A bare miss off color props passes through
 * silently — no cross-category story — while the same shape on a color
 * prop warns unknown-color, and the true category still resolves.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-TOKEN-16',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain('font-size: sm;')
    expect(sheet).toContain('color: md;')
    expect(sheet).toContain('border-radius: var(--radii-sm);')
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        severity: 'warning',
        code: 'ATM-W-UNKNOWN-COLOR',
        message: '`md` is neither a color token nor a CSS color',
      }),
    ])
  },
}

export default spec
