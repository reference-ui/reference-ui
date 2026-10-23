/**
 * Imported compound predicate refusal case. A plain recipe's compound predicate names a const
 * string imported from another file, which the compiler does not resolve across files. The
 * predicate is refused with ATM-E-RECIPE-FIELD naming compoundVariants[0].tone, with the same
 * message and help as ATM-RECIPE-16, and the refused definition is dropped whole.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../harness/helpers.js'

const PREDICATE_HELP = [
  'write compoundVariants[0].tone as a string literal or a list of them, or name a const string declared in this file',
]

const spec: AtomicCaseSpec = {
  id: 'ATM-RECIPE-18',
  verify(result) {
    expect(
      result.diagnostics.map(d => [d.code, d.severity, d.message, d.help])
    ).toEqual([
      [
        'ATM-E-RECIPE-FIELD',
        'error',
        "recipe 'importedTone': 'compoundVariants[0].tone' is not a string literal, a const string, or a non-empty list of them",
        PREDICATE_HELP,
      ],
    ])
    expect(result.diagnostics[0].file).toMatch(/input\/src\/recipe\.ts$/)
    expect(result.diagnostics.map(d => [d.line, d.column])).toEqual([[10, 30]])
    // The refused definition is dropped whole, so no runtime table is built.
    expect(result.runtime.recipes).toEqual({})
  },
}

export default spec
