// Unit tests for the base-system extends validation.
// They take candidate extends entries and assert accept or typed rejection.
// The entries ride validateConfig end to end, so the config-to-base arrow
// stays proven alongside the branch behavior.

import { describe, expect, it } from 'vitest'
import { validateConfig } from '../../config/validate.ts'

const SYSTEM_NAME = 'my-system'
const DEFAULT_INCLUDE = ['src/**/*.{ts,tsx}']
const FRAGMENT_CODE = 'fragment-code'
const STREAMS = [{ name: 'tokens', preamble: '@layer reset, global, base, tokens, recipes, utilities;\n' }]

describe('validateConfig extends', () => {
  it('requires extends to be an array of named systems with synced payloads', () => {
    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        extends: {} as never,
      })
    ).toThrowError(/field 'extends' is invalid/i)

    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        extends: [{} as never],
      })
    ).toThrowError(/must have a non-empty 'name'/i)

    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        extends: [{ name: 'upstream' } as never],
      })
    ).toThrowError(/must include synced system data/i)
  })

  it('accepts extends entries that only contribute streams or jsx elements', () => {
    const config = validateConfig({
      name: SYSTEM_NAME,
      include: DEFAULT_INCLUDE,
      extends: [
        { name: 'icons', fragment: '', jsxElements: ['HomeIcon'] },
        { name: 'tokens', fragment: '', streams: STREAMS },
      ],
    })

    expect(config.extends).toEqual([
      { name: 'icons', fragment: '', jsxElements: ['HomeIcon'] },
      { name: 'tokens', fragment: '', streams: STREAMS },
    ])
  })

  it('rejects extends entries whose streams array is empty', () => {
    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        extends: [{ name: 'tokens', fragment: '', streams: [] }],
      })
    ).toThrowError(/must include synced system data/i)
  })

  it('accepts valid extends entries', () => {
    const config = validateConfig({
      name: SYSTEM_NAME,
      include: DEFAULT_INCLUDE,
      extends: [{ name: 'base', fragment: FRAGMENT_CODE, jsxElements: ['IconShell'] }],
    })

    expect(config.extends).toEqual([{ name: 'base', fragment: FRAGMENT_CODE, jsxElements: ['IconShell'] }])
  })

  it('rejects invalid base-system jsxElements shapes', () => {
    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        extends: [{ name: 'base', fragment: FRAGMENT_CODE, jsxElements: 'IconShell' } as never],
      })
    ).toThrowError(/jsxElements/i)
  })
})

describe('validateConfig layers', () => {
  it('requires layers to be an array of named systems with synced payloads', () => {
    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        layers: {} as never,
      })
    ).toThrowError(/field 'layers' is invalid/i)

    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        layers: [{ name: 'upstream' } as never],
      })
    ).toThrowError(/must include synced system data/i)

    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        layers: [{ name: 'tokens', fragment: '', streams: [] }],
      })
    ).toThrowError(/must include synced system data/i)
  })

  it('accepts layers entries that only contribute streams', () => {
    const config = validateConfig({
      name: SYSTEM_NAME,
      include: DEFAULT_INCLUDE,
      layers: [{ name: 'tokens', fragment: '', streams: STREAMS }],
    })

    expect(config.layers).toEqual([{ name: 'tokens', fragment: '', streams: STREAMS }])
  })
})

describe('validateConfig extends edges', () => {
  it('rejects non-object extends entries', () => {
    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        extends: [null],
      })
    ).toThrowError(/entry 0 must be an object/i)
  })

  it('rejects whitespace-only extends names', () => {
    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        extends: [{ name: '   ', fragment: FRAGMENT_CODE }],
      })
    ).toThrowError(/must have a non-empty 'name'/i)
  })
})
