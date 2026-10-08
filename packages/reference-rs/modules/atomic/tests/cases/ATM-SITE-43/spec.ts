/**
 * TS enum member fence (ATM-SITE-43, SPEC-V2-45). Initialized string, numeric,
 * unary-numeric, boolean, and computed (`+` binaries, templates, `!`/`~`,
 * wrapped) members fold; member-reference and uninitialized members warn
 * per member with siblings kept; an inner const shadows the enum. Boolean
 * members record and refuse at resolve, exactly like bare bools
 * (planless, one InvalidCssValue warning).
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
  id: 'ATM-SITE-43',
  async verify(result) {
    expect(hasWant(result, 'padding', '4px')).toBe(true)
    expect(hasWant(result, 'padding', '2px')).toBe(true)
    expect(hasWant(result, 'margin', '8px')).toBe(true)
    expect(hasWant(result, 'margin', '3r')).toBe(true)
    expect(hasWant(result, 'width', '12px')).toBe(true)
    expect(hasWant(result, 'height', '4px')).toBe(true)
    expect(hasWant(result, 'zIndex', 99)).toBe(true)
    expect(hasWant(result, 'order', 1)).toBe(true)
    expect(hasWant(result, 'top', -1)).toBe(true)
    expect(hasWant(result, 'left', 2)).toBe(true)
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(hasWant(result, 'color', 'blue')).toBe(true)
    expect(hasWant(result, 'zIndex', 42)).toBe(true)
    expect(hasWant(result, 'backgroundColor', 'blue')).toBe(true)
    expect(hasWant(result, 'top', -2)).toBe(true)
    expect(hasWant(result, 'flexGrow', true)).toBe(true)
    expect(getWantsForProp(result, 'flexGrow')).toHaveLength(2)
    // The two refused positions harvest net-new pool lengths: padding
    // 12px/3r/8px, width 2px/3r/4px/8px (site twins skip).
    expect(siteWants(result)).toHaveLength(19)
    expect(harvestWants(result)).toHaveLength(7)
    expect(result.wants ?? []).toHaveLength(26)

    expect(siteWants(result).filter(w => w.prop === 'padding')).toHaveLength(3)
    expect(getWantsForProp(result, 'padding')).toHaveLength(6)
    expect(getWantsForProp(result, 'margin')).toHaveLength(3)

    const plans = result.stylePlans
    expect(plans).toHaveLength(22)

    // Member refusals + sink infos ride the opt-in channel now (S6
    // E8-class re-point); the two `true` flexGrow refusals are genuine
    // runtime misses (runtime queries `true`) and stay default.
    const defaults = result.diagnostics ?? []
    expect(defaults).toHaveLength(2)
    for (const d of defaults) {
      expect(d.code).toBe('ATM-W-INVALID-CSS-VALUE')
      expect(d.message).toContain('`true` is not valid CSS')
    }
    const opted = await compileCase('ATM-SITE-43', { logs: ['compiler'] })
    expect(opted.compilerDiagnostics, 'opt-in channel populates').toBeDefined()
    const channel = opted.compilerDiagnostics ?? []
    const warnings = channel.filter(d => d.severity === 'warning')
    const infos = channel.filter(d => d.code === 'ATM-I-HARVEST-SINK')
    expect(warnings).toHaveLength(2)
    expect(infos).toHaveLength(2)
    for (const d of infos) {
      expect(d.code).toBe('ATM-I-HARVEST-SINK')
    }
    const codes = warnings.map(d => d.code).sort()
    expect(codes).toEqual([
      'ATM-W-DYNAMIC-MEMBER',
      'ATM-W-DYNAMIC-MEMBER',
    ])
  },
}

export default spec
