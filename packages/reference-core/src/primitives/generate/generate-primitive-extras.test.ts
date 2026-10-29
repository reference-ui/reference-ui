// Unit tests for the documented primitive extras in the generated react types.
// They take the emitted source and assert that PrimitiveProps and every per-tag props type carry css, colorMode and variant
// with a JSDoc block each, and that variant names the exported PrimitiveVariant alias, so Reference prints a type name and a description.

import { describe, expect, it } from 'vitest'
import { ELEMENT_JSX_NAMES } from '../../native/element-vocabulary.ts'
import { generateReactTypesSource } from './generate.ts'

const SOURCE = generateReactTypesSource({ stylePropNames: ['color', 'p'], recipes: {} })

/** The declaration from `head` to its closing brace line. */
function declaration(head: string): string {
  const start = SOURCE.indexOf(head)
  if (start === -1) throw new Error(`${head}missing from the generated types`)
  const end = SOURCE.indexOf('\n}\n', start)
  if (end === -1) throw new Error(`${head}missing its closing brace`)
  return SOURCE.slice(start, end + 3)
}

const EXTRAS = [
  /\/\*\* Style object for this element[^\n]*\*\/\n  css\?: PrimitiveCssProp\n/,
  /\/\*\* Sets the color mode[^\n]*\*\/\n  colorMode\?: 'light' \| 'dark'\n/,
  /\/\*\* Sets `data-variant` on the element[^\n]*\*\/\n  variant\?: PrimitiveVariant\n/,
]

describe('primitive extras', () => {
  it('exports PrimitiveVariant as a documented string alias', () => {
    expect(SOURCE).toContain(
      '/** What `variant` takes: a string, stamped on the element as `data-variant`. */\nexport type PrimitiveVariant = string\n'
    )
  })

  it('documents css, colorMode and variant in PrimitiveProps', () => {
    const block = declaration('export type PrimitiveProps<T extends PrimitiveTag> = ')
    for (const extra of EXTRAS) expect(block).toMatch(extra)
  })

  it.each([...ELEMENT_JSX_NAMES])('documents css, colorMode and variant in %sProps', name => {
    const block = declaration(`export type ${name}Props = `)
    for (const extra of EXTRAS) expect(block).toMatch(extra)
  })
})
