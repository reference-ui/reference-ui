/**
 * Axis-shorthand station (ATM-SHORT-12). The four logical axis spellings
 * parse from JSX props and compile to single-declaration utilities on the
 * my/mx/px/py twin classes — never forked top/bottom halves, never dropped.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SHORT-12',
  verify(result) {
    expect(hasWant(result, 'marginX', '2r')).toBe(true)
    expect(hasWant(result, 'marginY', '8r')).toBe(true)
    expect(hasWant(result, 'paddingX', '1r')).toBe(true)
    expect(hasWant(result, 'paddingY', '0.5r')).toBe(true)

    const sheet = result.stylesheet
    // Single logical declarations, one per axis spelling.
    expect(sheet).toContain('margin-inline: calc(2 * var(--spacing-root));')
    expect(sheet).toContain('margin-block: calc(8 * var(--spacing-root));')
    expect(sheet).toContain('padding-inline: var(--spacing-root);')
    expect(sheet).toContain('padding-block: calc(0.5 * var(--spacing-root));')
    // No forked physical halves: the twin class carries the rule.
    expect(sheet).not.toContain('margin-top:')
    expect(sheet).not.toContain('margin-bottom:')
    expect(sheet).not.toContain('padding-left:')
    expect(sheet).not.toContain('padding-right:')

    const classes = result.css?.classes ?? {}
    // Authored spellings name the logical twin classes.
    expect(classes['marginX:2r']).toBe('@reference-ui/lib__mx_2r')
    expect(classes['marginY:8r']).toBe('@reference-ui/lib__my_8r')
    expect(classes['paddingX:1r']).toBe('@reference-ui/lib__px_1r')
    expect(classes['paddingY:0.5r']).toBe('@reference-ui/lib__py_0.5r')

    expect(result.diagnostics).toEqual([])
  },
}

export default spec
