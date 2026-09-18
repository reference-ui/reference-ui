/**
 * Paren-depth station. A function value must not swallow the next token:
 * `calc(1px + 1px) solid` is width + style, and `calc(1r * 2) 3r` is a
 * two-value margin expansion. Rhythm inside the calc body resolves per the
 * core shorthand battery (`calc(1r * 2)` lowers with `var(--spacing-root)`).
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SHORT-07',
  verify(result) {
    expect(hasWant(result, 'border', 'calc(1px + 1px) solid')).toBe(true)
    expect(hasWant(result, 'margin', 'calc(1r * 2) 3r')).toBe(true)
    const sheet = result.stylesheet
    expect(sheet).toContain('border-width: calc(1px + 1px);')
    expect(sheet).toContain('border-style: solid;')
    expect(sheet).not.toContain('border-color: calc(1px + 1px) solid')
    expect(sheet).toContain('margin-top: calc(var(--spacing-root) * 2);')
    expect(sheet).toContain('margin-right: calc(3 * var(--spacing-root));')
    expect(sheet).toContain('margin-bottom: calc(var(--spacing-root) * 2);')
    expect(sheet).toContain('margin-left: calc(3 * var(--spacing-root));')
    expect(result.atomCount).toBe(6)
    const classes = result.css?.classes ?? {}
    expect(classes['borderWidth:calc(1px + 1px)']).toBeDefined()
    expect(classes['borderStyle:solid']).toBeDefined()
    expect(classes['marginTop:calc(1r * 2)']).toBeDefined()
    expect(classes['marginRight:3r']).toBeDefined()
  },
}

export default spec
