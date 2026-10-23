// Unit tests for the Core token merge, leaf paths, and private stripping.
// They take token trees and assert merged output: a leaf replaces the earlier leaf
// whole, a group merges recursively, and the inputs stay untouched. They also pin
// the provenance keys and the `_private` strip, and the fragment tree guard that
// refuses a cyclic or over-deep tree by name.

import { describe, expect, it } from 'vitest'
import {
  assertFragmentTree,
  mergeTokenTree,
  stripPrivateTokensDeep,
  TokenTreeError,
  tokenLeafPaths,
} from './merge.ts'

describe('mergeTokenTree', () => {
  it('merges sibling token trees key by key', () => {
    const merged = mergeTokenTree(
      { colors: { red: { value: '#ff0000' } } },
      { spacing: { sm: { value: '0.5rem' } } }
    )

    expect(merged).toEqual({
      colors: { red: { value: '#ff0000' } },
      spacing: { sm: { value: '0.5rem' } },
    })
  })

  it('merges nested groups while later leaves win', () => {
    const merged = mergeTokenTree(
      { colors: { red: { value: '#ff0000' }, blue: { value: '#0000ff' } } },
      { colors: { red: { value: '#cc0000' } } }
    )

    expect(merged).toEqual({
      colors: { red: { value: '#cc0000' }, blue: { value: '#0000ff' } },
    })
  })

  it('replaces arrays wholesale instead of concatenating', () => {
    const merged = mergeTokenTree(
      { fonts: { weights: ['400'] } },
      { fonts: { weights: ['700'] } }
    )

    expect(merged).toEqual({ fonts: { weights: ['700'] } })
  })

})

describe('mergeTokenTree: leaf and group replacement', () => {
  it('drops the earlier dark value when a later leaf sets only value', () => {
    const merged = mergeTokenTree(
      { colors: { brand: { value: '#aaaaaa', dark: '#bbbbbb' } } },
      { colors: { brand: { value: '#cccccc' } } }
    )

    expect(merged).toEqual({ colors: { brand: { value: '#cccccc' } } })
  })

  it('drops the earlier group children when a later leaf replaces a group', () => {
    const merged = mergeTokenTree(
      { colors: { brand: { hover: { value: '#111111' }, active: { value: '#222222' } } } },
      { colors: { brand: { value: '#cccccc' } } }
    )

    expect(merged).toEqual({ colors: { brand: { value: '#cccccc' } } })
  })

  it('replaces an earlier leaf with a later group, keeping only the group children', () => {
    const merged = mergeTokenTree(
      { colors: { brand: { value: '#aaaaaa' } } },
      { colors: { brand: { hover: { value: '#111111' } } } }
    )

    expect(merged).toEqual({ colors: { brand: { hover: { value: '#111111' } } } })
  })

  it('leaves untouched siblings of a replaced leaf in place', () => {
    const merged = mergeTokenTree(
      { colors: { brand: { value: '#aaaaaa', dark: '#bbbbbb' }, ink: { value: '#000000' } } },
      { colors: { brand: { value: '#cccccc' } } }
    )

    expect(merged).toEqual({
      colors: { brand: { value: '#cccccc' }, ink: { value: '#000000' } },
    })
  })

  it('reports each leaf that replaces an earlier leaf, with its path and both leaves', () => {
    const replaced: Array<[string, unknown, unknown]> = []

    mergeTokenTree(
      { colors: { brand: { value: '#aaaaaa' }, ink: { value: '#000000' } } },
      { colors: { brand: { value: '#cccccc' }, paper: { value: '#ffffff' } } },
      (path, earlier, later) => replaced.push([path, earlier, later])
    )

    expect(replaced).toEqual([['colors.brand', { value: '#aaaaaa' }, { value: '#cccccc' }]])
  })

  it('never reports a leaf that replaces a group or fills an empty slot', () => {
    const replaced: string[] = []

    mergeTokenTree(
      { colors: { brand: { hover: { value: '#111111' } } } },
      { colors: { brand: { value: '#cccccc' }, paper: { value: '#ffffff' } } },
      (path) => replaced.push(path)
    )

    expect(replaced).toEqual([])
  })

  it('never mutates its inputs', () => {
    const base = { colors: { red: { value: '#ff0000', dark: '#880000' } } }
    const override = { colors: { red: { value: '#cc0000' }, blue: { value: '#0000ff' } } }

    const merged = mergeTokenTree(base, override)

    expect(base).toEqual({ colors: { red: { value: '#ff0000', dark: '#880000' } } })
    expect(override).toEqual({ colors: { red: { value: '#cc0000' }, blue: { value: '#0000ff' } } })
    expect(merged.colors).not.toBe(base.colors)
  })
})

describe('stripPrivateTokensDeep', () => {
  it('drops nested _private subtrees at any depth while keeping siblings', () => {
    expect(
      stripPrivateTokensDeep({
        colors: {
          up: { value: '#ffffff' },
          _private: { upstreamSecret: { value: '#999999' } },
          nested: { deep: { _private: { buried: { value: '#000000' } } } },
        },
        spacing: { sm: { value: '0.5rem' } },
      })
    ).toEqual({
      colors: {
        up: { value: '#ffffff' },
        nested: { deep: {} },
      },
      spacing: { sm: { value: '0.5rem' } },
    })
  })

  it('drops a top-level _private category', () => {
    expect(
      stripPrivateTokensDeep({
        colors: { up: { value: '#ffffff' } },
        _private: { vault: { value: '#123456' } },
      })
    ).toEqual({ colors: { up: { value: '#ffffff' } } })
  })

  it('keeps light and dark leaves that carry no private key', () => {
    const leaf = { light: '#222222', dark: '#f5f5f5' }

    expect(stripPrivateTokensDeep({ colors: { icon: leaf } })).toEqual({
      colors: { icon: { light: '#222222', dark: '#f5f5f5' } },
    })
  })

  it('never mutates its input', () => {
    const node = {
      colors: { up: { value: '#ffffff' }, _private: { upstreamSecret: { value: '#999999' } } },
    }

    stripPrivateTokensDeep(node)

    expect(node).toEqual({
      colors: { up: { value: '#ffffff' }, _private: { upstreamSecret: { value: '#999999' } } },
    })
  })
})

describe('tokenLeafPaths', () => {
  it('reports dotted paths to value leaves', () => {
    expect(
      tokenLeafPaths({
        colors: { blue: { 500: { value: '#3b82f6' } }, bg: { canvas: { value: '#fff', dark: '#000' } } },
        spacing: { 1: { value: '0.25rem' } },
      })
    ).toEqual(['colors.blue.500', 'colors.bg.canvas', 'spacing.1'])
  })

  it('treats light and dark leaves as leaves without a value key', () => {
    expect(tokenLeafPaths({ colors: { icon: { light: '#222', dark: '#eee' } } })).toEqual([
      'colors.icon',
    ])
  })

  it('skips non-object children', () => {
    expect(tokenLeafPaths({ colors: { stray: 'red' } })).toEqual([])
  })
})

// A group nested `levels` deep under `deep`: the innermost object sits at depth `levels`.
function nestedTree(levels: number): Record<string, unknown> {
  let node: Record<string, unknown> = { value: '#000' }
  for (let level = 1; level < levels; level += 1) node = { n: node }
  return { deep: node }
}

const SOURCE = { call: 'token', source: 'src/tokens.ts' } as const

describe('assertFragmentTree', () => {
  it('refuses a tree that contains itself, naming the call, path and file', () => {
    const colors: Record<string, unknown> = { brand: { value: '#000' } }
    colors.self = colors

    expect(() => assertFragmentTree({ colors }, SOURCE)).toThrow(
      new TokenTreeError('token tree cycles at colors.self (src/tokens.ts)')
    )
  })

  it('passes a subtree shared by two keys, which is not a cycle', () => {
    const shared = { value: '#000' }

    expect(() => assertFragmentTree({ a: { x: shared }, b: { y: shared } }, SOURCE)).not.toThrow()
  })

  it('passes a tree 100 levels deep and refuses one 101 levels deep at the first node past the limit', () => {
    expect(() => assertFragmentTree(nestedTree(100), SOURCE)).not.toThrow()
    const path = ['deep', ...Array(100).fill('n')].join('.')

    expect(() => assertFragmentTree(nestedTree(101), SOURCE)).toThrow(
      new TokenTreeError(`token tree nests deeper than 100 levels at ${path} (src/tokens.ts)`)
    )
  })

  it('refuses keyframes and globalCss cycles under their own call names', () => {
    const fade: Record<string, unknown> = { from: { opacity: '0' } }
    fade.again = fade
    const body: Record<string, unknown> = { margin: '0' }
    body.nested = body

    expect(() => assertFragmentTree({ fade }, { call: 'keyframes', source: 'src/motion.ts' })).toThrow(
      'keyframes tree cycles at fade.again (src/motion.ts)'
    )
    expect(() => assertFragmentTree({ body }, { call: 'globalCss', source: 'src/global.ts' })).toThrow(
      'globalCss tree cycles at body.nested (src/global.ts)'
    )
  })
})
