/**
 * Negative-scale station. `mt: '-4'` emits a negated custom property
 * reference, `mb: '4'` the plain reference, and the class keeps the minus.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-TOKEN-07',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain('margin-top: calc(-1 * var(--spacing-4));')
    expect(sheet).toContain('margin-bottom: var(--spacing-4);')
    const classes = result.css?.classes ?? {}
    expect(classes['mt:-4']).toBe('spacing-scale__mt_-4')
    expect(classes['mb:4']).toBe('spacing-scale__mb_4')
    expect(result.diagnostics).toEqual([])
  },
}

export default spec
