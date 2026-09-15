/**
 * css() call-site extract station. css, css.object, and multi-arg css all
 * produce wants from every static leaf they contain. recipe() is ATM-SITE-03.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-02',
  verify(result) {
    expect(hasWant(result, 'display', 'flex')).toBe(true)
    expect(hasWant(result, 'alignItems', 'center')).toBe(true)
    expect(hasWant(result, 'gap', '2r')).toBe(true)
    expect(hasWant(result, 'margin', '1r')).toBe(true)
    expect(hasWant(result, 'padding', '2r')).toBe(true)
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(result.diagnostics).toHaveLength(0)
  },
}

export default spec
