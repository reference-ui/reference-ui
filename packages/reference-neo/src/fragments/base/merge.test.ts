// Unit tests for the Neo fragment merge helper and leaf paths.
// They take fragment trees and assert merged output plus provenance keys.
// Merge conflicts resolve later-wins while the inputs stay untouched.

import { describe, expect, it } from 'vitest'
import { mergeFragmentObjects, tokenLeafPaths } from './merge.ts'

describe('mergeFragmentObjects', () => {
  it('merges sibling token trees key by key', () => {
    const merged = mergeFragmentObjects(
      { colors: { red: { value: '#ff0000' } } },
      { spacing: { sm: { value: '0.5rem' } } }
    )

    expect(merged).toEqual({
      colors: { red: { value: '#ff0000' } },
      spacing: { sm: { value: '0.5rem' } },
    })
  })

  it('merges nested objects while later scalars win', () => {
    const merged = mergeFragmentObjects(
      { colors: { red: { value: '#ff0000' }, blue: { value: '#0000ff' } } },
      { colors: { red: { value: '#cc0000' } } }
    )

    expect(merged).toEqual({
      colors: { red: { value: '#cc0000' }, blue: { value: '#0000ff' } },
    })
  })

  it('replaces arrays wholesale instead of concatenating', () => {
    const merged = mergeFragmentObjects(
      { fonts: { weights: ['400'] } },
      { fonts: { weights: ['700'] } }
    )

    expect(merged).toEqual({ fonts: { weights: ['700'] } })
  })

  it('never mutates its inputs', () => {
    const base = { colors: { red: { value: '#ff0000' } } }
    const override = { colors: { blue: { value: '#0000ff' } } }

    mergeFragmentObjects(base, override)

    expect(base).toEqual({ colors: { red: { value: '#ff0000' } } })
    expect(override).toEqual({ colors: { blue: { value: '#0000ff' } } })
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
