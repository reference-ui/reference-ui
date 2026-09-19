/**
 * Ternary-arm shapes station (SPEC-V2-15/16 remainder). Equal branches
 * collapse to one class, mixed-type arms both compile, and per-arm
 * `!important` sticks to the flagged arm only.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-64',
  verify(result) {
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(hasWant(result, 'margin', '4px')).toBe(true)
    expect(hasWant(result, 'margin', 8)).toBe(true)
    expect(hasWant(result, 'padding', '2r')).toBe(true)
    expect(hasWant(result, 'padding', '3r')).toBe(true)

    // Equal branches collapse: one class key, one utility.
    const colorKeys = Object.keys(result.css?.classes ?? {}).filter(k =>
      k.startsWith('color:'),
    )
    expect(colorKeys).toEqual(['color:red'])
    expect(result.css?.classes?.['color:red']).toBe('@reference-ui/lib__c_red')

    // Mixed-type arms both compile; per-arm `!` sticks to its arm only.
    expect(result.css?.classes?.['margin:4px']).toBe('@reference-ui/lib__m_4px')
    expect(result.css?.classes?.['margin:8']).toBe('@reference-ui/lib__m_8')
    expect(result.css?.classes?.['padding:2r']).toBe('@reference-ui/lib__p_2r!')
    expect(result.css?.classes?.['padding:3r']).toBe('@reference-ui/lib__p_3r')

    const plans = result.runtime.stylePlans
    for (const [prop, value] of [
      ['color', 'red'],
      ['margin', '4px'],
      ['margin', 8],
      ['padding', '2r'],
      ['padding', '3r'],
    ] as const) {
      expect(plans.find(p => p.prop === prop && p.value === value)).toBeDefined()
    }

    expect(result.diagnostics).toEqual([])
  },
}

export default spec
