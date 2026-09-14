/**
 * Shorthand cascade station. borderBottom and outline decompose to
 * longhands; currentColor is never emitted. Goldens are the stylesheet.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SHORT-01',
  ids: ['ATM-SHORT-01', 'ATM-SHORT-02'],
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain('border-bottom-width: 3px;')
    expect(sheet).toContain('border-bottom-style: solid;')
    expect(sheet).toContain('border-color: var(--colors-gray-800);')
    expect(sheet).toContain('outline-width: 1px;')
    expect(sheet).toContain('outline-style: solid;')
    expect(sheet).toContain('outline-color: var(--colors-blue-600);')
    expect(sheet).toContain('margin-top: calc(2 * var(--spacing-root));')
    expect(sheet).toContain('padding: var(--spacing-root);')
    expect(sheet.toLowerCase()).not.toContain('currentcolor')
  },
}

export default spec
