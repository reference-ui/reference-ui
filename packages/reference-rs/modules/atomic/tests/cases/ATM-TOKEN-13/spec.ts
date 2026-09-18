/**
 * Token custom-property kebab station. Every path segment kebabs (Panda parity):
 * camelCase leaves and mid-path segments define kebab names, and resolved
 * uses reference those same names — never the camel ghosts (RS-41).
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-TOKEN-13',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain(
      '--colors-ui-progress-track-mix-foreground: var(--colors-gray-950);'
    )
    expect(sheet).toContain('--colors-ui-progress-track-mix-background: #ffffff;')
    expect(sheet).toContain(
      '--colors-ui-meter-even-less-good-foreground: var(--colors-gray-950);'
    )
    expect(sheet).toContain('--colors-ui-progress-bar-foreground: var(--colors-gray-950);')
    expect(sheet).not.toContain('--colors-ui-progress-track-mixForeground')
    expect(sheet).not.toContain('--colors-ui-progress-track-mixBackground')
    expect(sheet).not.toContain('--colors-ui-meter-evenLessGood-foreground')
    const darkBlock = sheet.slice(sheet.indexOf('[data-color-mode=dark]'))
    expect(darkBlock).toContain(
      '--colors-ui-progress-track-mix-foreground: var(--colors-gray-50);'
    )
    expect(darkBlock).toContain(
      '--colors-ui-progress-track-mix-background: var(--colors-gray-950);'
    )
    expect(sheet).toContain('color: var(--colors-ui-progress-track-mix-foreground);')
    expect(sheet).toContain('background: var(--colors-ui-progress-track-mix-background);')
    expect(sheet).toContain(
      'border-color: var(--colors-ui-meter-even-less-good-foreground);'
    )
    expect(result.diagnostics).toEqual([])
  },
}

export default spec
