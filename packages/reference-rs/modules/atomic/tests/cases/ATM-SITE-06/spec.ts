/**
 * Local-const station. `const theme = { primary: 'n300' }` resolves at
 * JSX and css() sites as a want, without evaluating author JS.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-06',
  verify(result) {
    expect(hasWant(result, 'color', 'n300')).toBe(true)
    expect(hasWant(result, 'mt', '2r')).toBe(true)
    expect(
      (result.wants ?? []).filter(w => w.prop === 'color').length
    ).toBeGreaterThanOrEqual(2)
  },
}

export default spec
