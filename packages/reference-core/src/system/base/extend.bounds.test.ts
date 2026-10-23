// Bounds tests for extendSystem: an override tree the recursive merge cannot finish. A token tree that
// holds itself, or nests past MAX_FRAGMENT_TREE_DEPTH, must fail with a TokenTreeError that names the
// call, the dotted path and the base, before mergeTokenTree walks it. Without the guard a cycle overflows
// the stack as a RangeError during config evaluation.

import { describe, expect, it } from 'vitest'
import { MAX_FRAGMENT_TREE_DEPTH, TokenTreeError } from '../../collect/lib/merge.ts'
import { extendSystem } from './extend.ts'
import type { BaseSystem } from './types.ts'

const NAME = 'bounds-base'

const BASE: BaseSystem = {
  name: NAME,
  fragment: ';globalThis.bounds = 1',
  fragments: [{ name: NAME, bundle: ';tokens({})' }],
  streams: [{ name: NAME, preamble: '@layer reset, tokens;\n', tokensPortable: '', utilities: '' }],
}

// A `colors` group whose innermost object sits `levels` keys below it.
function nestedColors(levels: number): Record<string, unknown> {
  let node: Record<string, unknown> = { value: '#000' }
  for (let at = 0; at < levels; at += 1) node = { deep: node }
  return node
}

describe('extendSystem override bounds', () => {
  it('refuses a cyclic override tree by path and base', () => {
    const colors: Record<string, unknown> = { ink: { value: '#000' } }
    colors.self = colors
    const call = () => extendSystem(BASE, { tokens: { colors } })
    expect(call).toThrow(TokenTreeError)
    expect(call).toThrow(`extendSystem tree cycles at colors.self (${NAME})`)
  })

  it(`refuses an override tree nested past ${MAX_FRAGMENT_TREE_DEPTH} levels`, () => {
    const call = () => extendSystem(BASE, { tokens: { colors: nestedColors(MAX_FRAGMENT_TREE_DEPTH + 1) } })
    expect(call).toThrow(TokenTreeError)
    expect(call).toThrow(
      new RegExp(`^extendSystem tree nests deeper than ${MAX_FRAGMENT_TREE_DEPTH} levels at colors\\.deep.* \\(${NAME}\\)$`)
    )
  })
})
