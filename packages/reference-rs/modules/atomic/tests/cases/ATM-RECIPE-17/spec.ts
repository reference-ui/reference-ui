/**
 * Slotted recipe refusal case. A slotted recipe refuses a default that is a call or a `let`, and a
 * compound predicate that is a call or a `let`, each with ATM-E-RECIPE-FIELD naming the field. The
 * check reads each shared field once, so each refusal appears once, not once per slot, and the
 * refused definition is dropped whole.
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
  id: 'ATM-RECIPE-17',
  verify(result) {
    expect(
      result.diagnostics.map(d => [d.code, d.severity, d.message, d.help])
    ).toEqual([
      [
        'ATM-E-RECIPE-FIELD',
        'error',
        "recipe 'slotCallDefault': 'defaultVariants.size' is not a string literal or a const string declared in this file",
        DEFAULT_HELP,
      ],
      [
        'ATM-E-RECIPE-FIELD',
        'error',
        "recipe 'slotLetDefault': 'defaultVariants.size' is not a string literal or a const string declared in this file",
        DEFAULT_HELP,
      ],
      [
        'ATM-E-RECIPE-FIELD',
        'error',
        "recipe 'slotCallTone': 'compoundVariants[0].tone' is not a string literal, a const string, or a non-empty list of them",
        PREDICATE_HELP,
      ],
      [
        'ATM-E-RECIPE-FIELD',
        'error',
        "recipe 'slotLetTone': 'compoundVariants[0].tone' is not a string literal, a const string, or a non-empty list of them",
        PREDICATE_HELP,
      ],
    ])
    for (const diagnostic of result.diagnostics) {
      expect(diagnostic.file).toMatch(/input\/src\/recipe\.ts$/)
    }
    expect(result.diagnostics.map(d => [d.line, d.column])).toEqual([
      [16, 28],
      [28, 28],
      [40, 13],
      [56, 13],
    ])
    // Each refused definition is dropped whole, so no slot table is built.
    expect(result.runtime.recipes).toEqual({})
  },
}

export default spec
