/**
 * Lexical-function station (ATM-NAME-08). The class stem passes only through
 * explicit lexical functions -- never a host default. Every builtin divergence
 * carries a compiled input and a pinned outcome: radix and blank spellings
 * refuse with no class, -0 folds to 0, magnitudes outside the canonical range
 * refuse, a quoted carriage return survives the sanitize, marks outside the
 * structural set survive byte-identical, the fold is ASCII-only, and per-prop
 * object declarations follow the author's key order — integer-keyed
 * members included, in author order, never V8 order.
 */
import { expect } from 'vitest'
import { layerClassNames, type AtomicCaseSpec } from '../../helpers.js'

const SYSTEM = '@reference-ui/lib'

/** True for a per-prop value keyed by the integer conditions 10 and 2. */
function isIntValue(value: unknown): boolean {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const keys = Object.keys(value as Record<string, unknown>)
  return keys.length === 2 && keys.includes('10') && keys.includes('2')
}

function refusalFor(messages: Array<{ code: string; message: string }>, spelling: string) {
  const match = messages.find(d => d.message.includes(spelling))
  expect(match, `missing refusal for '${spelling}'`).toBeDefined()
  return match!
}

const spec: AtomicCaseSpec = {
  id: 'ATM-NAME-08',
  verify(result) {
    const utilities = layerClassNames(result.stylesheet, 'utilities')
    const classes = Object.values(result.css?.classes ?? {})

    // Green pins: refusals mint no class, -0 folds, quotes and marks survive.
    expect(utilities.has(`${SYSTEM}__top_0x10`)).toBe(false)
    expect(refusalFor(result.diagnostics, '0x10').code).toBe('ATM-W-NON-CANONICAL-NUMERIC')
    expect(result.stylesheet).not.toContain('margin: ;')
    expect(refusalFor(result.diagnostics, 'Empty string').code).toBe('ATM-W-INVALID-CSS-VALUE')
    expect(utilities.has(`${SYSTEM}__p_0`)).toBe(true)
    expect(classes.some(name => name.includes('\r'))).toBe(true)
    expect(utilities.has(`${SYSTEM}__p_a\uFEFFb`)).toBe(true)
    expect(utilities.has(`${SYSTEM}__c_\u0130nk`)).toBe(true)
    expect(utilities.has(`${SYSTEM}__bd-t-s_solid`)).toBe(true)
    const width = result.stylePlans.filter(plan => plan.prop === 'width')
    expect(width).toHaveLength(1)
    expect(width[0]!.declarations.map(d => d.slot)).toEqual(['width@md', 'width@base'])
    // Integer-keyed per-prop order follows the author too (doom-5): the
    // non-ascending plan emits [10, 2], the ascending control [2, 10].
    // Distinct values per shape so each plan is addressable by value.
    const intPlans = result.stylePlans.filter(plan => plan.prop === 'color' && isIntValue(plan.value))
    expect(intPlans).toHaveLength(2)
    const nonasc = intPlans.find(plan => (plan.value as Record<string, string>)['10'] === 'red')!
    const asc = intPlans.find(plan => (plan.value as Record<string, string>)['10'] === 'yellow')!
    expect(nonasc.declarations.map(d => d.slot)).toEqual(['10:color', '2:color'])
    expect(asc.declarations.map(d => d.slot)).toEqual(['2:color', '10:color'])

    // Red pins: magnitudes outside the canonical range refuse instead of
    // minting, and the next-line mark collapses as structural whitespace.
    expect(utilities.has(`${SYSTEM}__p_1000000000000000000000`)).toBe(false)
    expect(refusalFor(result.diagnostics, '1e21').code).toBe('ATM-W-NON-CANONICAL-NUMERIC')
    expect(utilities.has(`${SYSTEM}__p_0.0000001`)).toBe(false)
    expect(refusalFor(result.diagnostics, '1e-7').code).toBe('ATM-W-NON-CANONICAL-NUMERIC')
    // Settled against the lexical inventory: U+0085 is structural, so it
    // collapses to a space exactly like the other structural marks.
    expect(utilities.has(`${SYSTEM}__p_a\u0085b`)).toBe(false)
    expect(utilities.has(`${SYSTEM}__p_a_b`)).toBe(true)
  },
}

export default spec
