/**
 * Tokens-layer composite station. A `{path}` ref embedded in a composite
 * token value expands to `var(--…)` in `@layer tokens` exactly like the
 * utility path — light and dark blocks alike — while the whole-value alias
 * control keeps working and resolved refs stay silent.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-TOKEN-18',
  verify(result) {
    const sheet = result.stylesheet
    // Dark composite: the docs control-surface shape that emitted verbatim.
    const [, dark] = sheet.split('[data-color-mode=dark]')
    expect(dark).toContain(
      '--colors-docs-control-bg: color-mix(in oklch, var(--colors-gray-900) 72%, transparent);'
    )
    // Light composite and whole-value alias controls.
    expect(sheet).toContain('--colors-docs-control-bg: rgba(255, 255, 255, 0.72);')
    expect(sheet).toContain('--colors-docs-line: 1px solid var(--colors-gray-900);')
    expect(sheet).toContain('--colors-docs-alias: var(--colors-gray-900);')
    // No brace ref may survive into the sheet, resolved or otherwise.
    expect(sheet).not.toContain('{colors.')
    expect(result.diagnostics).toHaveLength(0)
    expect(result.atomCount).toBe(1)
  },
}

export default spec
