/**
 * Dimensional token-count station. `padding: 10px 20px` becomes four longhands.
 * `padding: 10px`, `p: 1r`, and `m: 2r` stay one atom each.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SHORT-05',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain('padding-top: 10px;')
    expect(sheet).toContain('padding-right: 20px;')
    expect(sheet).toContain('padding-bottom: 10px;')
    expect(sheet).toContain('padding-left: 20px;')
    expect(hasWant(result, 'padding', '10px')).toBe(true)
    expect(hasWant(result, 'p', '1r')).toBe(true)
    expect(hasWant(result, 'm', '2r')).toBe(true)
    expect(sheet).toContain('padding: 10px;')
    expect(sheet).toContain('padding: var(--spacing-root);')
    expect(sheet).toContain('margin: calc(2 * var(--spacing-root));')
  },
}

export default spec
