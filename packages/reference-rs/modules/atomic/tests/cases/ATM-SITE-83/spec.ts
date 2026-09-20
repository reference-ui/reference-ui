/**
 * JSX spread-bag station (Forge §12). A spread bag on a JSX host has
 * attribute semantics: `css` and `r` recurse like their attribute
 * spellings, style and condition keys extract, and `style`, `data-*`,
 * `aria-*`, handlers, and class names stay silent. `css()` keeps
 * style-object semantics, so `css: 1` still warns there.
 */
import { expect } from 'vitest'
import { compileCase, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const MD = '@container (min-width: 768px)'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-83',
  async verify(result) {
    // Recorded bag: style keys, the condition block, and the css prop all paint.
    expect(hasWant(result, 'color', 'blue.700')).toBe(true)
    expect(hasWant(result, 'borderBottomColor', 'gray.700')).toBe(true)
    expect(hasWant(result, 'backgroundColor', 'gray.100', ['_hover'])).toBe(true)
    expect(hasWant(result, 'paddingInline', '0.5rem')).toBe(true)
    expect(hasWant(result, 'backgroundColor', 'transparent')).toBe(true)
    expect(hasWant(result, 'margin', '2r')).toBe(true)
    // Inline bag: css recurses, r scopes under its container query, mt extracts.
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(hasWant(result, 'padding', '1r', [MD])).toBe(true)
    expect(hasWant(result, 'mt', '2r')).toBe(true)
    // Recorded r entry: the sub-key scopes exactly like the inline spelling.
    expect(hasWant(result, 'marginTop', '4px', [MD])).toBe(true)
    expect(hasWant(result, 'color', 'green.600')).toBe(true)
    // The css() control keeps its padding sibling.
    expect(hasWant(result, 'padding', '4px')).toBe(true)

    expect(result.wants ?? []).toHaveLength(12)

    const sheet = result.stylesheet
    expect(sheet).toContain('padding-inline: 0.5rem;')
    expect(sheet).toContain('background-color: transparent;')

    // The css() control diagnoses on the default channel: no bag warns,
    // and the unknown-prop line stays default (Wave-1b carve-out; S6
    // E8-class re-point moved it opt-in, the carve-out restores it).
    const defaults = result.diagnostics ?? []
    expect(defaults).toHaveLength(1)
    expect(defaults[0]).toMatchObject({
      severity: 'warning',
      code: 'ATM-W-UNKNOWN-PROPERTY',
      message: 'Unknown style property "css"',
      line: 42,
      column: 30,
    })
    expect(defaults[0]!.file ?? '').toContain('App.tsx')
    const opted = await compileCase('ATM-SITE-83', { logs: ['compiler'] })
    expect(opted.compilerDiagnostics, 'opt-in channel populates').toBeDefined()
    const moved = (opted.compilerDiagnostics ?? []).filter(
      d => d.code !== 'ATM-I-EXPECTED-LOOKUP' && d.code !== 'ATM-I-DYNAMIC-SLOT'
    )
    expect(moved).toHaveLength(0)
  },
}

export default spec
