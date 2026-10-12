/**
 * Custom tones from a BaseSystem dump. A flat leaf serves every role, a role
 * leaf serves its role, and a surface-only leaf serves the line role through
 * the surface fallback. Each tone prints its own custom property in the
 * tokens layer, dark values under the dark selector, and a fraction-valued
 * tone is not a percentage: it stays raw and warns once.
 */
import { expect } from 'vitest'
import { layerBody, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-TOKEN-22',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain('background: color-mix(in srgb, var(--colors-brand) var(--tones-hush), transparent);')
    expect(sheet).toContain('border-color: color-mix(in srgb, var(--colors-brand) var(--tones-hush), transparent);')
    expect(sheet).toContain('background: color-mix(in srgb, var(--colors-brand) var(--tones-medium-surface), transparent);')
    expect(sheet).toContain('border-color: color-mix(in srgb, var(--colors-brand) var(--tones-wash-surface), transparent);')
    expect(sheet).toContain('background: brand/arc;')
    const tokens = layerBody(sheet, 'tokens')
    expect(tokens).toContain('--tones-medium-surface: 12%;')
    const darkBlock = tokens.slice(tokens.indexOf('[data-color-mode=dark]'))
    expect(darkBlock).toContain('--tones-medium-surface: 16%;')
    expect(darkBlock).not.toContain('--tones-hush')
    const warnings = result.diagnostics.filter(d => d.code === 'ATM-W-UNKNOWN-TONE')
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toMatchObject({
      severity: 'warning',
      message: 'unknown tone `arc` in `brand/arc`',
    })
    expect(result.diagnostics).toHaveLength(1)
  },
}

export default spec
