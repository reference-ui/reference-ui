/**
 * Computed-key station. `[dynamicKey]` in a style object warns and does not
 * become a want. Static sibling properties still extract.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-LEAF-06',
  verify(result) {
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(hasWant(result, 'mt', '10px')).toBe(false)
    expect(result.diagnostics.length).toBeGreaterThanOrEqual(1)
    expect(result.diagnostics.some(d => d.severity === 'warning')).toBe(true)
    expect(
      result.diagnostics.some(d =>
        d.message.includes('Dynamic computed property key encountered in style object')
      )
    ).toBe(true)
    expect(result.diagnostics[0]?.file).toBeTruthy()
  },
}

export default spec
