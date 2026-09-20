/**
 * Ambiguous star station (Forge §1). A named import that two `export *`
 * barrels declare with different origins refuses: no fold at the site, and
 * each use diagnoses exactly as an unresolvable import does. Both twin
 * literals harvest onto the refused sink below (harvest can hide the miss;
 * the fold stands).
 */
import { expect } from 'vitest'
import { compileCase, harvestWants, hasWant, siteWants, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-79',
  async verify(result) {
    // Neither twin folds at the site; the spread's static sibling survives.
    const site = siteWants(result)
    expect(site.some(w => w.prop === 'color' &&
      (w.value as Record<string, string>).String === 'red')).toBe(false)
    expect(site.some(w => w.prop === 'color' &&
      (w.value as Record<string, string>).String === 'blue')).toBe(false)
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(hasWant(result, 'color', 'blue')).toBe(true)
    expect(hasWant(result, 'padding', '4px')).toBe(true)
    expect(harvestWants(result)).toHaveLength(2)
    expect(result.wants ?? []).toHaveLength(3)

    // Refusal + spread + sink info ride the opt-in channel now (S6
    // E8-class re-point); the default is silent.
    expect(result.diagnostics ?? []).toHaveLength(0)
    const opted = await compileCase('ATM-SITE-79', { logs: ['compiler'] })
    expect(opted.compilerDiagnostics, 'opt-in channel populates').toBeDefined()
    const moved = (opted.compilerDiagnostics ?? []).filter(
      d => d.code !== 'ATM-I-EXPECTED-LOOKUP' && d.code !== 'ATM-I-DYNAMIC-SLOT'
    )
    expect(moved).toEqual([
      expect.objectContaining({
        severity: 'warning',
        code: 'ATM-W-DYNAMIC-IDENTIFIER',
        message: "Dynamic non-literal identifier 'tone' encountered for prop 'color'",
      }),
      expect.objectContaining({
        severity: 'warning',
        code: 'ATM-W-UNFOLDABLE-SPREAD',
        message:
          'Dynamic object spread encountered in style object; keeping sibling properties',
      }),
      expect.objectContaining({
        severity: 'info',
        code: 'ATM-I-HARVEST-SINK',
        message: 'color under []: 2 harvested values minted',
      }),
    ])
  },
}

export default spec
