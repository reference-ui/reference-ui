/**
 * Slotted recipe refusal case. A slotted recipe takes its variant maps inline, so a named or
 * spread variant map, a slot entry that is not an object, and a compound entry that is not an
 * inline object are refused whole with ATM-E-RECIPE-FIELD. A slot map that is not an inline
 * object keeps its ATM-E-RECIPE-SLOT refusal.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../harness/helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-RECIPE-13',
  verify(result) {
    expect(
      result.diagnostics.map(d => [d.code, d.severity, d.message, d.help])
    ).toEqual([
      [
        'ATM-E-RECIPE-FIELD',
        'error',
        "recipe 'slotVariants': 'variants' must be an inline object literal in a slotted recipe",
        ['write variants inline as an object literal'],
      ],
      [
        'ATM-E-RECIPE-FIELD',
        'error',
        "recipe 'slotAxis': 'variants.size' must be an inline object literal in a slotted recipe",
        ['write variants.size inline as an object literal'],
      ],
      [
        'ATM-E-RECIPE-FIELD',
        'error',
        "recipe 'slotSpread': 'variants.size' spreads a value; a slotted recipe writes each variant inline",
        ['write variants.size inline as an object literal'],
      ],
      [
        'ATM-E-RECIPE-FIELD',
        'error',
        "recipe 'slotEntry': 'base.root' is not an object literal or a const object literal",
        ['write base.root inline as an object literal'],
      ],
      [
        'ATM-E-RECIPE-SLOT',
        'error',
        "recipe 'slotMap': a slot map must be an inline object keyed by slot name",
        undefined,
      ],
      [
        'ATM-E-RECIPE-FIELD',
        'error',
        "recipe 'slotCompound': 'compoundVariants[0]' must be an inline object literal",
        ['write compoundVariants[0] inline as an object literal'],
      ],
      [
        'ATM-E-RECIPE-FIELD',
        'error',
        "recipe 'slotSpreadCompound': 'compoundVariants[0]' spreads a value; write its predicates and css inline",
        ['write compoundVariants[0] inline as an object literal'],
      ],
    ])
    for (const diagnostic of result.diagnostics) {
      expect(diagnostic.file).toMatch(/input\/src\/recipe\.ts$/)
    }
    expect(result.diagnostics.map(d => [d.line, d.column])).toEqual([
      [12, 13],
      [18, 21],
      [24, 26],
      [30, 17],
      [36, 9],
      [43, 22],
      [50, 24],
    ])
    // Each slotted definition above is refused whole, so no slot table is built.
    expect(result.runtime.recipes).toEqual({})
  },
}

export default spec
