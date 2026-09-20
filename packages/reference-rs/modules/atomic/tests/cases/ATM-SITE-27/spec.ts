/**
 * Object-arm and mid-array ternary station (ATM-SITE-27, SPEC-V2-17 +
 * SPEC-V2-27 + §3 S3). Object-valued arms compile per arm; a lone
 * unfoldable arm keeps its resolvable sibling plus one warning. Mid-array
 * ternaries project both arms at one breakpoint, elision keeps arity, and
 * top-level ternary args extract both arms.
 */
import { expect } from 'vitest'
import {
  compileCase,
  harvestWants,
  hasWant,
  siteWants,
  type AtomicCaseSpec,
} from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-27',
  async verify(result) {
    expect(hasWant(result, 'color', 'white', ['base'])).toBe(true)
    expect(hasWant(result, 'color', 'black', ['base'])).toBe(true)
    const siteColor = siteWants(result).filter(w => w.prop === 'color')
    expect(siteColor.filter(w =>
      (w.value as Record<string, string>).String === 'white',
    )).toHaveLength(2)
    expect(siteColor.filter(w =>
      (w.value as Record<string, string>).String === 'black',
    )).toHaveLength(2)
    expect(hasWant(result, 'color', 'red', [])).toBe(true)
    expect(hasWant(result, 'color', 'blue', [])).toBe(true)

    expect(hasWant(result, 'padding', 2, ['base'])).toBe(true)
    expect(hasWant(result, 'padding', 2, ['sm'])).toBe(true)
    expect(hasWant(result, 'padding', 3, ['sm'])).toBe(true)
    expect(hasWant(result, 'padding', 4, ['md'])).toBe(true)
    expect(hasWant(result, 'padding', 1, ['base'])).toBe(true)
    expect(hasWant(result, 'padding', 3, ['md'])).toBe(true)

    expect(siteWants(result)).toHaveLength(12)
    // The refused color position harvests black/white; red/blue twin the
    // site's unscoped plans and skip.
    expect(harvestWants(result)).toHaveLength(2)
    expect(result.wants ?? []).toHaveLength(14)

    const plans = result.stylePlans
    expect(plans).toHaveLength(7)
    expect(plans.some(p => p.prop === 'color' && p.value === 'red')).toBe(true)
    expect(plans.some(p => p.prop === 'color' && p.value === 'blue')).toBe(true)
    expect(plans.some(
      p => p.prop === 'color' && JSON.stringify(p.value) === '{"base":"white"}',
    )).toBe(true)
    expect(plans.some(
      p => p.prop === 'color' && JSON.stringify(p.value) === '{"base":"black"}',
    )).toBe(true)
    expect(plans.some(
      p => p.prop === 'padding' && JSON.stringify(p.value) === '[1,null,3]',
    )).toBe(true)
    // Harvested black/white plan beside the red/blue site plans.
    expect(plans.some(
      p => p.prop === 'color' && p.value === 'black' && p.when.length === 0,
    )).toBe(true)
    expect(plans.some(
      p => p.prop === 'color' && p.value === 'white' && p.when.length === 0,
    )).toBe(true)

    // Warns + sink info ride the opt-in channel now (S6 E8-class
    // re-point); the default is silent.
    expect(result.diagnostics ?? []).toHaveLength(0)
    const opted = await compileCase('ATM-SITE-27', { logs: ['compiler'] })
    expect(opted.compilerDiagnostics, 'opt-in channel populates').toBeDefined()
    const channel = opted.compilerDiagnostics ?? []
    const warnings = channel.filter(d => d.severity === 'warning')
    const infos = channel.filter(d => d.code === 'ATM-I-HARVEST-SINK')
    expect(warnings).toHaveLength(2)
    for (const diagnostic of warnings) {
      expect(diagnostic.message).toMatch(/Dynamic non-literal expression/)
    }
    expect(infos).toHaveLength(1)
    expect(infos[0]!.code).toBe('ATM-I-HARVEST-SINK')

    expect(result.stylesheet).toContain('color: white;')
    expect(result.stylesheet).toContain('color: black;')
    expect(result.stylesheet).toContain('color: red;')
    expect(result.stylesheet).toContain('color: blue;')
  },
}

export default spec
