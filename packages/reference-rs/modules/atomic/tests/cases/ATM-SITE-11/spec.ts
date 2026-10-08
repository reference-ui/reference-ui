/**
 * Identifier-spread station. `{...base}` on JSX and inside css() unpacks
 * known keys from a file-top const object. Inline object spreads are
 * ATM-SITE-05.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-11',
  verify(result) {
    expect(hasWant(result, 'mt', '2r')).toBe(true)
    expect(hasWant(result, 'bg', 'n300')).toBe(true)
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(hasWant(result, 'p', '1r')).toBe(true)
  },
}

export default spec
