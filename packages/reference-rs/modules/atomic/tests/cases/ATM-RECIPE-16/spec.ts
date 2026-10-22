/**
 * Plain recipe refusal case. A default that is a call or a `let`, a predicate that is a call, a
 * `let` or a list with an unreadable entry, and a defaults map that is a name or a spread are each
 * refused with ATM-E-RECIPE-FIELD, naming the field. Every refused definition is dropped whole, so
 * the runtime table set is empty.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../harness/helpers.js'

const DEFAULT_HELP = [
  'write defaultVariants.size as a string literal, or name a const string declared in this file',
]
const PREDICATE_HELP = [
  'write compoundVariants[0].tone as a string literal or a list of them, or name a const string declared in this file',
]

const spec: AtomicCaseSpec = {
  id: 'ATM-RECIPE-16',
  verify(result) {
    expect(
      result.diagnostics.map(d => [d.code, d.severity, d.message, d.help])
    ).toEqual([
      [
        'ATM-E-RECIPE-FIELD',
        'error',
        "recipe 'callDefault': 'defaultVariants.size' is not a string literal or a const string declared in this file",
        DEFAULT_HELP,
      ],
      [
        'ATM-E-RECIPE-FIELD',
        'error',
        "recipe 'letDefault': 'defaultVariants.size' is not a string literal or a const string declared in this file",
        DEFAULT_HELP,
      ],
      [
        'ATM-E-RECIPE-FIELD',
        'error',
        "recipe 'callTone': 'compoundVariants[0].tone' is not a string literal, a const string, or a non-empty list of them",
        PREDICATE_HELP,
      ],
      [
        'ATM-E-RECIPE-FIELD',
        'error',
        "recipe 'letTone': 'compoundVariants[0].tone' is not a string literal, a const string, or a non-empty list of them",
        PREDICATE_HELP,
      ],
      [
        'ATM-E-RECIPE-FIELD',
        'error',
        "recipe 'callList': 'compoundVariants[0].tone' is not a string literal, a const string, or a non-empty list of them",
        PREDICATE_HELP,
      ],
      [
        'ATM-E-RECIPE-FIELD',
        'error',
        "recipe 'namedDefaults': 'defaultVariants' must be an inline object literal",
        ['write defaultVariants inline as an object literal'],
      ],
      [
        'ATM-E-RECIPE-FIELD',
        'error',
        "recipe 'spreadDefaults': 'defaultVariants' spreads a value; write each default inline",
        ['write each entry of defaultVariants inline'],
      ],
    ])
    for (const diagnostic of result.diagnostics) {
      expect(diagnostic.file).toMatch(/input\/src\/recipe\.ts$/)
    }
    expect(result.diagnostics.map(d => [d.line, d.column])).toEqual([
      [10, 28],
      [16, 28],
      [25, 30],
      [34, 30],
      [43, 30],
      [51, 20],
      [57, 22],
    ])
    // Each refused definition is dropped whole, so no runtime table is built.
    expect(result.runtime.recipes).toEqual({})
  },
}

export default spec
