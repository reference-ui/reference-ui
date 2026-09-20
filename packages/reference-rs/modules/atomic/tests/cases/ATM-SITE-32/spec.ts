/**
 * Per-shape refuse station (ATM-SITE-32, SPEC-V2-42). Ten impure shapes
 * each warn once and mint zero site wants while their static margin sibling
 * extracts with a runtime plan. Doom tripwires for the Ph3 fold table. The
 * refused color position harvests 'red' below (Forge §2 floor).
 */
import { expect } from 'vitest'
import {
  compileCase,
  getWantsForProp,
  harvestWants,
  hasWant,
  siteWants,
  type AtomicCaseSpec,
} from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-32',
  async verify(result) {
    for (const value of ['1r', '2r', '3r', '4r', '5r', '6r', '7r', '8r', '9r', '10r']) {
      expect(hasWant(result, 'margin', value)).toBe(true)
    }
    expect(siteWants(result).filter(w => w.prop === 'color')).toHaveLength(0)
    expect(getWantsForProp(result, 'color')).toHaveLength(1)
    expect(harvestWants(result)).toHaveLength(1)
    expect(result.wants ?? []).toHaveLength(11)

    const plans = result.stylePlans
    expect(plans).toHaveLength(11)
    expect(plans.some(p => p.prop === 'color' && p.value === 'red')).toBe(true)

    // Per-shape refusals ride the opt-in channel now (S6 E8-class
    // re-point); the default is silent.
    expect(result.diagnostics ?? []).toHaveLength(0)
    const opted = await compileCase('ATM-SITE-32', { logs: ['compiler'] })
    expect(opted.compilerDiagnostics, 'opt-in channel populates').toBeDefined()
    const channel = opted.compilerDiagnostics ?? []
    const warnings = channel.filter(d => d.severity === 'warning')
    const infos = channel.filter(d => d.code === 'ATM-I-HARVEST-SINK')
    expect(warnings).toHaveLength(10)
    expect(infos).toHaveLength(1)
    expect(infos[0]!.code).toBe('ATM-I-HARVEST-SINK')

    expect(result.stylesheet).toContain('margin: var(--spacing-root);')
  },
}

export default spec
