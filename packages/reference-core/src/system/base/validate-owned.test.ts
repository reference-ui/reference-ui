// Unit tests for the jsxOwned shape check on base-system entries.
// They take candidate extends and layers entries that own props and assert accept or a
// located rejection. The entries ride validateConfig end to end, so the config-to-base
// arrow stays proven alongside the shape check, and a key need not be a roster name.

import { describe, expect, it } from 'vitest'
import { validateConfig } from '../../config/validate.ts'

const SYSTEM_NAME = 'my-system'
const DEFAULT_INCLUDE = ['src/**/*.{ts,tsx}']
const FRAGMENT_CODE = 'fragment-code'
const STREAMS = [{ name: 'tokens', preamble: '@layer reset, global, base, tokens, recipes, utilities;\n' }]

const MALFORMED: Array<[string, unknown]> = [
  ['an array', ['size']],
  ['a string', 'size'],
  ['a map whose value is a string', { Tile: 'size' }],
  ['a map whose value is an object', { Tile: { size: true } }],
  ['a map whose array holds a number', { Tile: ['size', 3] }],
  ['a map with a null value', { Tile: null }],
]

describe('validateConfig jsxOwned', () => {
  it('accepts an extends entry that owns props, listed in the roster or not', () => {
    const base = {
      name: 'base',
      fragment: FRAGMENT_CODE,
      jsxElements: ['Tile'],
      jsxOwned: { Tile: ['size'], Elsewhere: ['tone'] },
    }
    const config = validateConfig({ name: SYSTEM_NAME, include: DEFAULT_INCLUDE, extends: [base] })

    expect(config.extends).toEqual([base])
  })

  it('accepts a layers entry that owns props', () => {
    const icons = { name: 'icons', fragment: FRAGMENT_CODE, streams: STREAMS, jsxOwned: { HomeIcon: ['size'] } }
    const config = validateConfig({ name: SYSTEM_NAME, include: DEFAULT_INCLUDE, layers: [icons] })

    expect(config.layers).toEqual([icons])
  })

  it('accepts an empty map, and reads a null jsxOwned as nothing owned', () => {
    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        extends: [{ name: 'base', fragment: FRAGMENT_CODE, jsxOwned: {} }],
      })
    ).not.toThrow()
    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        extends: [{ name: 'base', fragment: FRAGMENT_CODE, jsxOwned: null } as never],
      })
    ).not.toThrow()
  })

  it.each(MALFORMED)('rejects an extends entry whose jsxOwned is %s', (_label, jsxOwned) => {
    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        extends: [{ name: 'base', fragment: FRAGMENT_CODE, jsxOwned } as never],
      })
    ).toThrowError(
      /^Config field 'extends' is invalid\.\nEntry 0 \(base\) must have 'jsxOwned' as an object mapping component names to arrays of strings\.$/
    )
  })

  it('rejects a layers entry whose jsxOwned is malformed, naming the entry and the field', () => {
    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        layers: [
          { name: 'ok', fragment: FRAGMENT_CODE, streams: STREAMS },
          { name: 'icons', fragment: FRAGMENT_CODE, streams: STREAMS, jsxOwned: { Icon: 'size' } } as never,
        ],
      })
    ).toThrowError(
      /^Config field 'layers' is invalid\.\nEntry 1 \(icons\) must have 'jsxOwned' as an object mapping component names to arrays of strings\.$/
    )
  })
})
