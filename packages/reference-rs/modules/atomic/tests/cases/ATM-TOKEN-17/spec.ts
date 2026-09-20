/**
 * Negated-brace station. A leading `-` distributes over an explicit braced
 * lookup: `-{spacing.4}` calc-wraps silently, opacity composes in either
 * brace position (`-{path/50}`, `-{path}/50`), `-{unknown.path}` fails
 * closed with an `UnknownTokenReference` error plus a dropped declaration
 * (ATM-TOKEN-12 parity), and the `-1px solid {colors…}` composite keeps
 * interpolation with no calc-wrap.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const COLOR_MIX = 'color-mix(in srgb, var(--colors-blue-600) 50%, transparent)'

const spec: AtomicCaseSpec = {
  id: 'ATM-TOKEN-17',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain('margin-top: calc(-1 * var(--spacing-4));')
    expect(sheet).toContain(`color: calc(-1 * ${COLOR_MIX});`)
    expect(sheet).toContain(`background-color: calc(-1 * ${COLOR_MIX});`)
    expect(sheet).not.toContain('-var(')
    expect(sheet).not.toContain('-color-mix(')
    // Composite control: the shorthand expands, the literal is preserved,
    // the inner ref expands, and nothing calc-wraps.
    expect(sheet).toContain('border-color: var(--colors-blue-600);')
    expect(sheet).toContain('border-style: solid;')
    expect(sheet).toContain('border-width: -1px;')
    // The unknown arm drops its declaration while valid siblings still emit.
    expect(sheet).not.toContain('unknown.path')
    expect(sheet).not.toContain('margin-left')
    expect(result.atomCount).toBe(6)
    // Exactly the unknown arm's error plus proof's proven-miss warning: the
    // three calc-wrap arms and the composite are all silent.
    expect(result.diagnostics).toHaveLength(2)
    const error = result.diagnostics.find(d => d.severity === 'error')
    expect(error?.code).toBe('ATM-E-UNKNOWN-TOKEN')
    expect(error?.message).toContain('unknown token reference `{unknown.path}`')
    expect(error?.file).toMatch(/App\.tsx$/)
    expect(error?.line).toBe(8)
    expect(error?.column).toBeGreaterThan(0)
    const miss = result.diagnostics.find(
      d => d.code === 'ATM-W-MISSING-STYLE-PLAN'
    )
    expect(miss?.severity).toBe('warning')
    expect(miss?.message).toContain('ml: -{unknown.path}')
    expect(miss?.message).toContain('has no compiled style plan')
    // Classes map covers the served-class half; the dropped arm mints nothing.
    const classes = result.css?.classes ?? {}
    expect(classes['mt:-{spacing.4}']).toBe('negated-brace__mt_-{spacing.4}')
    expect(classes['color:-{colors.blue.600/50}']).toBe(
      'negated-brace__c_-{colors.blue.600/50}'
    )
    expect(classes['backgroundColor:-{colors.blue.600}/50']).toBe(
      'negated-brace__bg-c_-{colors.blue.600}/50'
    )
    expect(classes['borderColor:{colors.blue.600}']).toBe(
      'negated-brace__bd-c_{colors.blue.600}'
    )
    expect(classes['borderStyle:solid']).toBe('negated-brace__border-style_solid')
    expect(classes['borderWidth:-1px']).toBe('negated-brace__bd-w_-1px')
    expect(Object.keys(classes)).toHaveLength(6)
    expect(Object.keys(classes).join(' ')).not.toContain('unknown')
  },
}

export default spec
