/**
 * Computed-key station. `[dynamicKey]` in a style object warns and does not
 * become a want. Static sibling properties still extract.
 */
import { expect } from 'vitest'
import { compileCase, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-LEAF-06',
  async verify(result) {
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(hasWant(result, 'mt', '10px')).toBe(false)

    // The computed-key refusal rides the opt-in channel now (S6 E8-class
    // re-point); the default is silent.
    expect(result.diagnostics ?? []).toHaveLength(0)
    const opted = await compileCase('ATM-LEAF-06', { logs: ['compiler'] })
    expect(opted.compilerDiagnostics, 'opt-in channel populates').toBeDefined()
    const channel = opted.compilerDiagnostics ?? []
    const keys = channel.filter(d => d.code === 'ATM-W-UNFOLDABLE-KEY')
    expect(keys.length).toBeGreaterThanOrEqual(1)
    expect(keys.some(d => d.severity === 'warning')).toBe(true)
    expect(
      keys.some(d =>
        d.message.includes('Dynamic computed property key encountered in style object')
      )
    ).toBe(true)
    expect(keys[0]?.file).toBeTruthy()
  },
}

export default spec
