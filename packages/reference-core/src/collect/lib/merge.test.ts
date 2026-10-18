// Unit tests for the Core token merge, leaf paths, and private stripping.
// They take token trees and assert merged output: a leaf replaces the earlier leaf
// whole, a group merges recursively, and the inputs stay untouched. They also pin
// the provenance keys and the `_private` strip.

import { describe, expect, it } from 'vitest'
import { mergeTokenTree, stripPrivateTokensDeep, tokenLeafPaths } from './merge.ts'

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
