/**
 * Harvest condition station (Forge §2 sinks). A sink under `_hover` mints
 * `"_hover:color:..."` only: the pool crosses the sink carrying the sink's
 * `when`, and no unconditioned twins leak into the map.
 */
import { expect } from 'vitest'
import { compileCase, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-HARVEST-03',
  async verify(result) {
    // Both pool colors mint under the sink's `_hover` scope.
    expect(hasWant(result, 'color', 'red', ['_hover'])).toBe(true)
    expect(hasWant(result, 'color', '#0af', ['_hover'])).toBe(true)
    expect(result.wants ?? []).toHaveLength(2)

    // Conditioned twins only; nothing unconditioned.
    const classes = result.css?.classes ?? {}
    expect(classes['_hover:color:red']).toBeDefined()
    expect(classes['_hover:color:#0af']).toBeDefined()
    expect(classes['color:red']).toBeUndefined()
    expect(classes['color:#0af']).toBeUndefined()

    const sheet = result.stylesheet
    expect(sheet).toContain('color: red;')
    expect(sheet).toContain('color: #0af;')

    // Warn + sink info ride the opt-in channel now (S6 E8-class
    // re-point); the default is silent.
    expect(result.diagnostics ?? []).toHaveLength(0)
    const opted = await compileCase('ATM-HARVEST-03', { logs: ['compiler'] })
    expect(opted.compilerDiagnostics, 'opt-in channel populates').toBeDefined()
    const moved = (opted.compilerDiagnostics ?? []).filter(
      d => d.code !== 'ATM-I-EXPECTED-LOOKUP' && d.code !== 'ATM-I-DYNAMIC-SLOT'
    )
    expect(moved).toEqual([
      expect.objectContaining({
        severity: 'warning',
        code: 'ATM-W-DYNAMIC-IDENTIFIER',
      }),
      expect.objectContaining({
        severity: 'info',
        code: 'ATM-I-HARVEST-SINK',
        message: 'color under [_hover]: 2 harvested values minted',
      }),
    ])
  },
}

export default spec
