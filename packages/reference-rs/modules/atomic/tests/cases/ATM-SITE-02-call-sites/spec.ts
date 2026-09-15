/**
 * Call-site extract station. css, css.raw, cva, sva, and multi-arg css
 * all produce wants from every static leaf they contain.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-02',
  ids: ['ATM-SITE-02', 'ATM-SITE-03', 'ATM-SITE-04'],
  verify(result) {
    expect(hasWant(result, 'display', 'flex')).toBe(true)
    expect(hasWant(result, 'alignItems', 'center')).toBe(true)
    expect(hasWant(result, 'gap', '2r')).toBe(true)
    expect(hasWant(result, 'margin', '1r')).toBe(true)
    expect(hasWant(result, 'padding', '2r')).toBe(true)
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(hasWant(result, 'fontWeight', 'bold')).toBe(true)
    expect(hasWant(result, 'bg', 'blue')).toBe(true)
    expect(hasWant(result, 'color', 'white')).toBe(true)
    expect(hasWant(result, 'border', '1px solid')).toBe(true)
    expect(hasWant(result, 'opacity', '0.9')).toBe(true)
    expect(hasWant(result, 'padding', '4r')).toBe(true)
    expect(hasWant(result, 'borderRadius', 'md')).toBe(true)
    expect(hasWant(result, 'color', 'green')).toBe(true)
    expect(result.diagnostics).toHaveLength(0)
  },
}

export default spec
