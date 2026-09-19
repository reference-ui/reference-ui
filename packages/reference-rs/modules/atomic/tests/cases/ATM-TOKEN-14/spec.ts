/**
 * Alphabet-fence station (§9). Complete CSS values pass through without a
 * dictionary lookup and without diagnostics; the dotted control still
 * resolves through the dictionary, and the dotted miss still warns.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-TOKEN-14',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain('color: rgba(0,0,0,0.5);')
    expect(sheet).toContain('background-color: oklch(0.7 0.1 180);')
    expect(sheet).toContain('border-color: color-mix(in srgb, red 50%, blue);')
    expect(sheet).toContain('outline-color: var(--colors-gray-800);')
    expect(sheet).toContain('transform: translateX(1.25rem);')
    expect(sheet).toContain('width: calc(100% - 2px);')
    expect(sheet).toContain('background-image: url(/img.png);')
    expect(sheet).toContain('caret-color: ui.missing.path;')
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        severity: 'warning',
        code: 'ATM-W-UNKNOWN-TOKEN-PATH',
        message: 'unknown token path `ui.missing.path`',
      }),
    ])
  },
}

export default spec
