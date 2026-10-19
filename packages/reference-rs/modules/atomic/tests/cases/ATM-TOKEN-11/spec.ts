/**
 * Token alias reference {path} resolution in @layer tokens.
 * Aliases resolve to `var()` in the default block and flip under `[data-color-mode=dark]`.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../harness/helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-TOKEN-11',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain('--colors-ui-button-background: var(--colors-gray-950);')
    expect(sheet).toContain('--colors-ui-button-foreground: var(--colors-gray-50);')
    const darkBlock = sheet.slice(sheet.indexOf('[data-color-mode=dark]'))
    expect(darkBlock).toContain('--colors-ui-button-background: var(--colors-gray-50);')
    expect(darkBlock).toContain('--colors-ui-button-foreground: var(--colors-gray-950);')
  },
}

export default spec
