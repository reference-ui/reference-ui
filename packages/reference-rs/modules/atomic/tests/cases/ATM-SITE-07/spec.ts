/**
 * Non-style DOM attributes and hallucinated primitives are ignored.
 * id / onClick / tabIndex / aria-label never become wants. Foo is not
 * a StyleProps host, so its color does not extract. No diagnostics.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-07',
  verify(result) {
    expect(hasWant(result, 'mt', '2r')).toBe(true)
    expect(hasWant(result, 'id', 'root')).toBe(false)
    expect(hasWant(result, 'onClick', true)).toBe(false)
    expect(hasWant(result, 'tabIndex', 0)).toBe(false)
    expect(hasWant(result, 'aria-label', 'hello')).toBe(false)
    expect(hasWant(result, 'color', 'red')).toBe(false)
    expect(result.diagnostics).toEqual([])
  },
}

export default spec
