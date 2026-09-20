/**
 * Unknown-prop-policy station (ATM-SITE-20, N12 + tails-d). One policy,
 * every path: unknown style keys warn and drop — `css()` literals, const
 * spreads, and `globalCss` declarations alike. No silent swallows, no
 * hyphenated dead properties.
 */
import { expect } from 'vitest'
import { compileCase, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const SYSTEM = 'site-unknown-prop-policy'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-20',
  async verify(result) {
    expect(hasWant(result, 'fooBar', 'x')).toBe(false)
    expect(hasWant(result, 'frobnicate', 'x')).toBe(false)
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(hasWant(result, 'color', 'green')).toBe(true)

    const sheet = result.stylesheet
    expect(sheet).toContain('color: red;')
    expect(sheet).toContain('color: green;')
    expect(sheet).toContain('.btn:hover { color: blue }')
    expect(sheet).not.toContain('foo-bar')
    expect(sheet).not.toContain('divide-x')
    expect(sheet).not.toContain('frobnicate')
    expect(result.css?.classes).toEqual({
      'color:red': `${SYSTEM}__c_red`,
      'color:green': `${SYSTEM}__c_green`,
    })

    // One policy, one channel (Wave-1b carve-out restores the S6 E8-class
    // re-point): adjudicated per line — the global-CSS line stays default
    // per O8 R3, and the three css-surface extract refusals (two literals
    // via object/mod.rs, one const spread via lower.rs) return to default.
    const defaults = result.diagnostics ?? []
    expect(defaults).toHaveLength(4)
    for (const [suffix, line, column, message] of [
      ['App.tsx', 3, 24, 'Unknown style property "fooBar"'],
      ['App.tsx', 3, 37, 'Unknown style property "divideX"'],
      ['App.tsx', 7, 27, 'Unknown style property "frobnicate"'],
      ['n12', 1, 1, 'Unknown style property in global CSS: "divideX"'],
    ] as const) {
      const diag = defaults.find(
        d =>
          (d.file ?? '').endsWith(suffix) &&
          d.line === line &&
          d.column === column
      )
      expect(diag, `default diagnostic at ${suffix}:${line}`).toBeDefined()
      expect(diag!.severity).toBe('warning')
      expect(diag!.code).toBe('ATM-W-UNKNOWN-PROPERTY')
      expect(diag!.message).toBe(message)
      expect(diag!.column).toBe(column)
    }
    const opted = await compileCase('ATM-SITE-20', { logs: ['compiler'] })
    expect(opted.compilerDiagnostics, 'opt-in channel populates').toBeDefined()
    const extract = (opted.compilerDiagnostics ?? []).filter(
      d => d.code === 'ATM-W-UNKNOWN-PROPERTY'
    )
    expect(extract).toHaveLength(0)
  },
}

export default spec
