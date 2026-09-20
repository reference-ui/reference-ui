/**
 * Harvest wholesale-in-hole station. A holey template is not a color; a
 * wholesale `'red'` sitting in its hole is. That literal mints onto a
 * whole-value wrap `css({ color })` wearing backticks. `${n}px` on `width`
 * is a partial and mints nothing — no length was written wholesale.
 */
import { expect } from 'vitest'
import { compileCase, harvestWants, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-HARVEST-05',
  async verify(result) {
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(hasWant(result, 'width', 'red')).toBe(false)
    expect(result.wants ?? []).toHaveLength(1)
    expect(harvestWants(result)).toHaveLength(1)

    const classes = result.css?.classes ?? {}
    expect(classes['color:red']).toBeDefined()
    expect(classes['width:red']).toBeUndefined()
    expect(Object.keys(classes).some(key => key.startsWith('width:'))).toBe(false)

    // Warns + sink infos ride the opt-in channel now (S6 E8-class
    // re-point); the default is silent.
    expect(result.diagnostics ?? []).toHaveLength(0)
    const opted = await compileCase('ATM-HARVEST-05', { logs: ['compiler'] })
    expect(opted.compilerDiagnostics, 'opt-in channel populates').toBeDefined()
    const channel = opted.compilerDiagnostics ?? []
    const infos = channel.filter(d => d.code === 'ATM-I-HARVEST-SINK')
    expect(infos).toEqual([
      expect.objectContaining({
        code: 'ATM-I-HARVEST-SINK',
        message: 'color under []: 1 harvested value minted',
      }),
      expect.objectContaining({
        code: 'ATM-I-HARVEST-SINK',
        message: 'width under []: 0 harvested values minted',
      }),
    ])

    const warnings = channel.filter(d => d.severity === 'warning')
    expect(warnings).toHaveLength(2)
    expect(warnings.every(d => d.code === 'ATM-W-DYNAMIC-TEMPLATE')).toBe(true)
  },
}

export default spec
