/**
 * Harvest floor station (Forge §2). `'red'` lives only in an array no site
 * reads, a dynamic `css({ color })` site exists, and `"color:red"` is in the
 * map anyway — minted by harvest onto the refused sink, with one
 * `ATM-I-HARVEST-SINK` counting it. The `'4px'` pool twin does not land on
 * the color sink (kind gate).
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-HARVEST-01',
  verify(result) {
    // The site mints padding; harvest mints the refused color.
    expect(hasWant(result, 'padding', '4px')).toBe(true)
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(result.wants ?? []).toHaveLength(2)

    // `"color:red"` is in the map; the length pool twin minted nowhere.
    const classes = result.css?.classes ?? {}
    expect(classes['color:red']).toBeDefined()
    expect(Object.keys(classes).sort()).toEqual(['color:red', 'padding:4px'])

    const sheet = result.stylesheet
    expect(sheet).toContain('color: red;')

    // The runtime plan is the floor: the dynamic lookup hits precomputed data.
    const plans = result.runtime?.stylePlans ?? []
    expect(
      plans.some(p => p.prop === 'color' && p.value === 'red' && p.when.length === 0)
    ).toBe(true)

    // The site still warns (it is dynamic); the sink infos its count.
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        severity: 'warning',
        code: 'ATM-W-DYNAMIC-IDENTIFIER',
      }),
      expect.objectContaining({
        severity: 'info',
        code: 'ATM-I-HARVEST-SINK',
        message: 'color under []: 1 harvested value minted',
      }),
    ])
  },
}

export default spec
