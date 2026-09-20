/**
 * Dynamic-slot station (SPEC-V2-26 GAP-26). An unresolvable identifier in
 * a responsive value array warns once and is omitted while the null hole
 * skips silently; static leaves keep their breakpoints (arity honest).
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
  id: 'ATM-SITE-69',
  async verify(result) {
    expect(hasWant(result, 'padding', '4px', ['base'])).toBe(true)
    // Each refused slot sinks under its own breakpoint scope.
    expect(siteWants(result).filter(w => w.prop === 'padding')).toHaveLength(1)
    expect(getWantsForProp(result, 'padding')).toHaveLength(2)
    // Leading dynamic slot: the static leaf still lands on sm, not base.
    expect(hasWant(result, 'color', 'black', ['sm'])).toBe(true)
    expect(siteWants(result).filter(w => w.prop === 'color')).toHaveLength(1)
    expect(getWantsForProp(result, 'color')).toHaveLength(2)
    expect(harvestWants(result)).toHaveLength(2)

    // Slot refusals ride the opt-in channel now (S6 E8-class re-point);
    // the default is silent.
    expect(result.diagnostics ?? []).toHaveLength(0)
    const opted = await compileCase('ATM-SITE-69', { logs: ['compiler'] })
    expect(opted.compilerDiagnostics, 'opt-in channel populates').toBeDefined()
    const channel = opted.compilerDiagnostics ?? []
    const warnings = channel.filter(d => d.severity === 'warning')
    const infos = channel.filter(d => d.code === 'ATM-I-HARVEST-SINK')
    expect(warnings).toHaveLength(2)
    expect(warnings[0]!.message).toMatch(/Dynamic non-literal/)
    expect(infos).toHaveLength(2)
    for (const d of infos) {
      expect(d.code).toBe('ATM-I-HARVEST-SINK')
    }
  },
}

export default spec
