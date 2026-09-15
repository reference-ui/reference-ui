/**
 * Dialect-utility station. `container` / `font` / `weight` / `size`
 * expand to longhands. Lib `font="sans"` includes tracking.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-COND-05',
  verify(result) {
    expect(hasWant(result, 'container', 'sidebar')).toBe(true)
    expect(hasWant(result, 'font', 'sans')).toBe(true)
    expect(hasWant(result, 'weight', 'bold')).toBe(true)
    expect(hasWant(result, 'size', '20px')).toBe(true)
    expect(result.stylesheet).toContain('container-type: inline-size;')
    expect(result.stylesheet).toContain('container-name: sidebar;')
    expect(result.stylesheet).toContain('font-family: var(--fonts-sans);')
    expect(result.stylesheet).toContain('letter-spacing: -0.01em;')
    expect(result.stylesheet).toContain('font-weight: 700;')
    expect(result.stylesheet).toContain('width: 20px;')
    expect(result.stylesheet).toContain('height: 20px;')
  },
}

export default spec
