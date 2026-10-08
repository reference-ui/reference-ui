/**
 * Ambiguous star station (Forge §1). A named import that two `export *`
 * barrels declare with different origins refuses: no fold at the site, and
 * each use diagnoses exactly as an unresolvable import does. Neither twin
 * literal harvests below: both are unlicensed (the color allowlist), so
 * the miss stays visible and the sink infos zero.
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
    expect(hasWant(result, 'color', 'red')).toBe(false)
    expect(hasWant(result, 'color', 'blue')).toBe(false)
    expect(hasWant(result, 'padding', '4px')).toBe(true)
    expect(harvestWants(result)).toHaveLength(0)
    expect(result.wants ?? []).toHaveLength(1)

    // Refusal + spread + sink info ride the opt-in channel now (S6
    // E8-class re-point); but the uncovered `color: red` lookup proves an
    // exact miss, so it warns on the default (Wave-1b carve-out: harvest
    // no longer hides it).
    expect(result.diagnostics ?? []).toEqual([
      expect.objectContaining({
        severity: 'warning',
        code: 'ATM-W-MISSING-STYLE-PLAN',
        message: '`color: red` has no compiled style plan; this lookup will emit no class',
      }),
    ])
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
        message: 'color under []: 0 harvested values minted',
      }),
    ])
  },
}

export default spec
