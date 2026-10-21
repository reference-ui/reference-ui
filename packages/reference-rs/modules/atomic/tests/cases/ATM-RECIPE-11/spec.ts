/**
 * Slot refusal case. Malformed slotted definitions are refused whole with
 * ATM-E-RECIPE-SLOT at the offending node; a plain recipe on a slot stem and a
 * plain/slotted className clash are refused with ATM-E-DUPLICATE-RECIPE.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../harness/helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-RECIPE-11',
  verify(result) {
    expect(result.diagnostics.map(d => [d.code, d.message])).toEqual([
      ['ATM-E-RECIPE-SLOT', "recipe 'stray' styles unknown slot 'header'; its slots are: root, title"],
      ['ATM-E-RECIPE-SLOT', "recipe 'listless': 'slots' must be an inline array of string literals"],
      ['ATM-E-RECIPE-SLOT', "recipe 'twice' lists slot 'root' twice"],
      ['ATM-E-RECIPE-SLOT', "recipe 'empty': 'slots' must name at least one slot"],
      [
        'ATM-E-DUPLICATE-RECIPE',
        "Recipe class stem 'card__root' within system '@reference-ui/lib' is claimed by slot 'root' of recipe 'card' and recipe 'card__root'",
      ],
      ['ATM-E-DUPLICATE-RECIPE', "Duplicate recipe className 'shared' within system '@reference-ui/lib'"],
    ])
    for (const diagnostic of result.diagnostics) {
      expect(diagnostic.severity).toBe('error')
      expect(diagnostic.file).toMatch(/input\/src\/recipe\.ts$/)
    }
    expect(result.diagnostics.map(d => d.line)).toEqual([6, 9, 11, 13, 17, 21])
    // Columns point at the header key, the 'root' string, the second 'root', the [], and each recipe( call.
    expect(result.diagnostics.map(d => [d.line, d.column])).toEqual([
      [6, 38],
      [9, 64],
      [11, 67],
      [13, 58],
      [17, 25],
      [21, 28],
    ])
    expect(Object.keys(result.runtime.recipes).sort()).toEqual([
      '@reference-ui/lib__card__root',
      '@reference-ui/lib__shared__root',
    ])
  },
}

export default spec
