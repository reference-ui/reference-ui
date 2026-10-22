/**
 * Plain recipe refusal case. A recipe field the walker cannot read, a variant axis or spread
 * it cannot resolve, and a compound entry that is not an inline object are each refused with
 * ATM-E-RECIPE-FIELD at the offending node, naming the field. Every refused definition is
 * dropped whole, so the runtime table set is empty.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../harness/helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-RECIPE-12',
  verify(result) {
    expect(
      result.diagnostics.map(d => [d.code, d.severity, d.message, d.help])
    ).toEqual([
      [
        'ATM-E-RECIPE-FIELD',
        'error',
        "recipe 'byName': 'variants' is not an object literal or a const object literal",
        ['write variants inline as an object literal'],
      ],
      [
        'ATM-E-RECIPE-FIELD',
        'error',
        "recipe 'byAxis': 'variants.size' is not an object literal or a const object literal",
        ['write variants.size inline as an object literal'],
      ],
      [
        'ATM-E-RECIPE-FIELD',
        'error',
        "recipe 'spreadAxis': 'variants.size' spreads a value that is not an object literal or a const object literal",
        ['write variants.size inline as an object literal'],
      ],
      [
        'ATM-E-RECIPE-FIELD',
        'error',
        "recipe 'byEntry': 'compoundVariants[1]' must be an inline object literal",
        ['write compoundVariants[1] inline as an object literal'],
      ],
      [
        'ATM-E-RECIPE-FIELD',
        'error',
        "recipe 'byStyle': 'base' is not an object literal or a const object literal",
        ['write base inline as an object literal'],
      ],
      [
        'ATM-E-RECIPE-FIELD',
        'error',
        "recipe 'byStyle': 'variants.size.sm' is not an object literal or a const object literal",
        ['write variants.size.sm inline as an object literal'],
      ],
      [
        'ATM-E-RECIPE-FIELD',
        'error',
        "recipe 'byKey': 'variants' has a computed key; name each entry with a plain key",
        ['name each entry of variants with a plain key'],
      ],
      [
        'ATM-E-RECIPE-FIELD',
        'error',
        "recipe 'spreadEntry': 'compoundVariants[0]' spreads a value; write its predicates and css inline",
        ['write compoundVariants[0] inline as an object literal'],
      ],
      [
        'ATM-E-RECIPE-FIELD',
        'error',
        "recipe 'dynamicItem': 'variants.size.sm' is not an object literal or a const object literal",
        ['write variants.size.sm inline as an object literal'],
      ],
      [
        'ATM-E-RECIPE-FIELD',
        'error',
        "recipe 'listCompound': 'compoundVariants' must be an inline array literal",
        ['write compoundVariants inline as an array literal'],
      ],
      [
        'ATM-E-RECIPE-FIELD',
        'error',
        "recipe 'spreadTop': 'variants' spreads a value that is not an object literal or a const object literal",
        ['write variants inline as an object literal'],
      ],
    ])
    for (const diagnostic of result.diagnostics) {
      expect(diagnostic.file).toMatch(/input\/src\/recipe\.ts$/)
    }
    // Each column points at the offending value: the identifier, the spread argument, or the entry.
    expect(result.diagnostics.map(d => [d.line, d.column])).toEqual([
      [8, 63],
      [10, 71],
      [14, 26],
      [20, 64],
      [25, 9],
      [26, 27],
      [33, 16],
      [39, 24],
      [45, 81],
      [52, 21],
      [57, 74],
    ])
    // Every definition above is refused whole, so no recipe table is built.
    expect(result.runtime.recipes).toEqual({})
  },
}

export default spec
