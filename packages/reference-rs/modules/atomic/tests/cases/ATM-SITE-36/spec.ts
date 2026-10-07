/**
 * Callee-identity station (ATM-SITE-36, SPEC-V2-37). Shadowed and
 * non-allowlisted callees skip silently with zero wants; self-init,
 * cycles, no-init lets, bare functions, and missing members warn once
 * each while their margin siblings extract with runtime plans.
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
  id: 'ATM-SITE-36',
  async verify(result) {
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(hasWant(result, 'padding', '4px')).toBe(true)
    for (const value of ['1r', '2r', '3r', '4r', '5r']) {
      expect(hasWant(result, 'margin', value)).toBe(true)
    }
    // Refused callees leak nothing at the site; the literals they name
    // are unlicensed (the color allowlist), so the refused color sink
    // harvests nothing and infos zero.
    const siteColor = siteWants(result).filter(w => w.prop === 'color')
    for (const leaked of ['blue', 'green', 'purple']) {
      expect(siteColor.some(w =>
        (w.value as Record<string, string>).String === leaked)).toBe(false)
      expect(hasWant(result, 'color', leaked)).toBe(false)
    }
    expect(siteColor).toHaveLength(1)
    expect(getWantsForProp(result, 'color')).toHaveLength(1)
    expect(harvestWants(result)).toHaveLength(0)
    expect(result.wants ?? []).toHaveLength(7)

    const plans = result.stylePlans
    expect(plans).toHaveLength(7)

    // Callee refusals ride the opt-in channel now (S6 E8-class
    // re-point); the default is silent.
    expect(result.diagnostics ?? []).toHaveLength(0)
    const opted = await compileCase('ATM-SITE-36', { logs: ['compiler'] })
    expect(opted.compilerDiagnostics, 'opt-in channel populates').toBeDefined()
    const channel = opted.compilerDiagnostics ?? []
    const warnings = channel.filter(d => d.severity === 'warning')
    const infos = channel.filter(d => d.code === 'ATM-I-HARVEST-SINK')
    expect(warnings).toHaveLength(5)
    expect(infos).toHaveLength(1)
    expect(infos[0]!.code).toBe('ATM-I-HARVEST-SINK')
    const messages = warnings.map(d => d.message).join('\n')
    expect(messages).toMatch(/'s'/)
    expect(messages).toMatch(/'c1'/)
    expect(messages).toMatch(/'shade'/)
    expect(messages).toMatch(/'getColor'/)
  },
}

export default spec
