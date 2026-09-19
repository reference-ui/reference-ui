/**
 * Harvest condition station (Forge §2 sinks). A sink under `_hover` mints
 * `"_hover:color:..."` only: the pool crosses the sink carrying the sink's
 * `when`, and no unconditioned twins leak into the map.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-HARVEST-03',
  verify(result) {
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

    expect(result.diagnostics).toEqual([
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
