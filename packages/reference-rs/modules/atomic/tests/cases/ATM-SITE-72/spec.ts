/**
 * Param-shadow (arrow arm). Params named `css` on arrow
 * and function declarations shadow the import: their calls drop silently
 * while the outer live call still extracts.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../harness/helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-72',
  verify(result) {
    expect(hasWant(result, 'color', 'blue')).toBe(true)
    expect(hasWant(result, 'color', 'red')).toBe(false)
    expect(hasWant(result, 'color', 'green')).toBe(false)
    expect(result.diagnostics).toEqual([])
  },
}

export default spec
