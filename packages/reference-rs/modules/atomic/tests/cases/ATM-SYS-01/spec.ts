/**
 * System emission anchor. Compiles with the frozen lib spec so its committed
 * stylesheet pins the canonical `@layer global` and `@layer tokens` emission in
 * full; every other station collapses those bodies via `normalizeSystemLayers`.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SYS-01',
  verify(result) {
    expect(result.stylesheet).toContain('@layer global {')
    expect(result.stylesheet).toContain('@layer tokens {')
    expect(result.stylesheet).toContain('@keyframes ')
    expect(result.stylesheet).toContain('--colors-')
    expect(hasWant(result, 'display', 'flex')).toBe(true)
    expect(result.diagnostics).toHaveLength(0)
  },
}

export default spec
