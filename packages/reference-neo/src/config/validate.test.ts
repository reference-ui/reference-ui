// Unit tests for the Neo config validator over the surviving fields.
// They take candidate configs and assert accept or typed rejection.
// This file is a Neo-owned copy of the core validator tests trimmed with the surface.

import { describe, expect, it } from 'vitest'
import { validateConfig } from './validate.ts'

const SYSTEM_NAME = 'my-system'
const DEFAULT_INCLUDE = ['src/**/*.{ts,tsx}']
const FRAGMENT_CODE = 'fragment-code'
const LAYERS_CSS = '.root { color: red; }'

describe('validateConfig base fields', () => {
  it('unwraps a default export object', () => {
    const config = validateConfig({
      default: {
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
      },
    })

    expect(config).toEqual({
      name: SYSTEM_NAME,
      include: DEFAULT_INCLUDE,
    })
  })

  it('rejects non-object configs', () => {
    expect(() => validateConfig(null)).toThrowError(/must export a config object/i)
  })

  it('requires include to be an array', () => {
    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
      })
    ).toThrowError(/must have an 'include' array/i)
  })

  it('requires name to be a non-empty string', () => {
    expect(() =>
      validateConfig({
        name: '   ',
        include: DEFAULT_INCLUDE,
      })
    ).toThrowError(/must have a non-empty 'name'/i)
  })

  it('rejects names with quotes or newlines', () => {
    expect(() =>
      validateConfig({
        name: 'bad"name',
        include: DEFAULT_INCLUDE,
      })
    ).toThrowError(/safe for CSS @layer/i)

    expect(() =>
      validateConfig({
        name: 'bad\nname',
        include: DEFAULT_INCLUDE,
      })
    ).toThrowError(/safe for CSS @layer/i)
  })

  it('ignores unknown fields as core does today', () => {
    const config = validateConfig({
      name: SYSTEM_NAME,
      include: DEFAULT_INCLUDE,
      strict: ['colors'],
      mcp: { include: ['src/**'] },
      layers: [{ name: 'layered' }],
    })

    expect(config.name).toBe(SYSTEM_NAME)
    expect(config.include).toEqual(DEFAULT_INCLUDE)
  })
})

describe('validateConfig jsxElements', () => {
  it('accepts top-level jsxElements as an explicit config escape hatch', () => {
    const config = validateConfig({
      name: SYSTEM_NAME,
      include: DEFAULT_INCLUDE,
      jsxElements: ['GeneratedIcon', 'CardFrame'],
    })

    expect(config.jsxElements).toEqual(['GeneratedIcon', 'CardFrame'])
  })

  it('rejects invalid top-level jsxElements shapes', () => {
    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        jsxElements: 'GeneratedIcon' as never,
      })
    ).toThrowError(/jsxElements/i)

    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        jsxElements: ['GeneratedIcon', 123] as never,
      })
    ).toThrowError(/jsxElements/i)
  })
})

describe('validateConfig staticCss', () => {
  it('accepts property-to-values maps with wildcards and condition prefixes', () => {
    const config = validateConfig({
      name: SYSTEM_NAME,
      include: DEFAULT_INCLUDE,
      staticCss: { color: ['brand', '*'], '_hover:color': ['text'] },
    })

    expect(config.staticCss).toEqual({ color: ['brand', '*'], '_hover:color': ['text'] })
  })

  it('rejects invalid staticCss shapes', () => {
    for (const staticCss of ['color' as never, ['color'] as never, 42 as never]) {
      expect(() =>
        validateConfig({ name: SYSTEM_NAME, include: DEFAULT_INCLUDE, staticCss })
      ).toThrowError(/must be an object mapping style properties/i)
    }

    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        staticCss: { color: 'brand' } as never,
      })
    ).toThrowError(/entry 'color' must be an array of strings/i)

    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        staticCss: { color: ['brand', 7] } as never,
      })
    ).toThrowError(/entry 'color' must be an array of strings/i)
  })
})

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

  it('accepts extends entries that only contribute css or jsx elements', () => {
    const config = validateConfig({
      name: SYSTEM_NAME,
      include: DEFAULT_INCLUDE,
      extends: [
        { name: 'icons', fragment: '', jsxElements: ['HomeIcon'] },
        { name: 'tokens', fragment: '', css: LAYERS_CSS },
      ],
    })

    expect(config.extends).toEqual([
      { name: 'icons', fragment: '', jsxElements: ['HomeIcon'] },
      { name: 'tokens', fragment: '', css: LAYERS_CSS },
    ])
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
