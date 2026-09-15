/**
 * Authored-important station. Trailing `!` on JSX and css() string leaves
 * sets Want.important and names the class `mt_2r!`.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-LEAF-09',
  verify(result) {
    expect(hasWant(result, 'mt', '2r')).toBe(true)
    expect(hasWant(result, 'p', '1r')).toBe(true)
    const mt = (result.wants ?? []).find(w => w.prop === 'mt')
    const p = (result.wants ?? []).find(w => w.prop === 'p')
    expect(mt?.important).toBe(true)
    expect(p?.important).toBe(true)
    expect(result.css?.classes?.['mt:2r']).toBe('mt_2r!')
    expect(result.stylesheet).toContain('.mt_2r\\!')
    expect(result.stylesheet).toContain('margin-top: calc(2 * var(--spacing-root)) !important;')
  },
}

export default spec
