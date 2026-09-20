/**
 * Logical-operator extract station. Guards keep the guard rule; all-literal
 * non-guard operands fold to the picked operand with no dead atom.
 * Unresolvable dynamic identifiers emit diagnostic warnings while resolving valid operands.
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
  id: 'ATM-LEAF-04',
  async verify(result) {
    expect(hasWant(result, 'border', '1px solid')).toBe(true)
    expect(hasWant(result, 'borderColor', 'red')).toBe(false)
    expect(hasWant(result, 'borderColor', 0)).toBe(true)
    expect(hasWant(result, 'outline', '2px solid')).toBe(true)
    expect(hasWant(result, 'color', 'red')).toBe(true)
    // The `||` dead arm stays dead at the site: the site's single `blue`
    // is the `??` fallback; harvest mints its own floor below.
    expect(hasWant(result, 'color', 'blue')).toBe(true)
    expect(siteWants(result).filter(w => w.prop === 'color')).toHaveLength(2)
    expect(getWantsForProp(result, 'color')).toHaveLength(3)
    expect(hasWant(result, 'bg', 'green')).toBe(true)
    expect(hasWant(result, 'margin', '2r')).toBe(true)
    // The three refused positions harvest net-new pairs only: bg blue/red
    // plus color green (twins of site atoms skip).
    expect(harvestWants(result)).toHaveLength(3)
    expect(result.wants ?? []).toHaveLength(10)
    // Refusals + sink infos ride the opt-in channel now (S6 E8-class
    // re-point); the default is silent.
    expect(result.diagnostics ?? []).toHaveLength(0)
    const opted = await compileCase('ATM-LEAF-04', { logs: ['compiler'] })
    expect(opted.compilerDiagnostics, 'opt-in channel populates').toBeDefined()
    const channel = opted.compilerDiagnostics ?? []
    const warnings = channel.filter(d => d.severity === 'warning')
    const infos = channel.filter(d => d.code === 'ATM-I-HARVEST-SINK')
    // The margin sink is covered incidentally (every offered value is a
    // static plan, zero net-new): silent on the default, but its refusal
    // and info facts are visible opt-in beside the two uncovered pairs.
    expect(warnings).toHaveLength(3)
    expect(infos).toHaveLength(3)
    for (const d of infos) {
      expect(d.code).toBe('ATM-I-HARVEST-SINK')
    }
    const margin = warnings.find(d => d.message.includes("'customMargin'"))
    expect(margin, 'covered margin refusal visible opt-in').toBeDefined()
  },
}

export default spec
