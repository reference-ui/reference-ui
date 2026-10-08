// Unit tests for the Neo config validator over the surviving fields.
// They take candidate configs and assert accept or typed rejection.
// This file is a Neo-owned copy of the core validator tests trimmed with the surface.

import { describe, expect, it } from 'vitest'
import { validateConfig } from './validate.ts'

const SYSTEM_NAME = 'my-system'
const DEFAULT_INCLUDE = ['src/**/*.{ts,tsx}']

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
    // layers is a known field since the S5 cutover wired it; only genuinely
    // unknown fields ride this test now.
    const config = validateConfig({
      name: SYSTEM_NAME,
      include: DEFAULT_INCLUDE,
      strict: ['colors'],
      mcp: { include: ['src/**'] },
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

describe('validateConfig logs', () => {
  it('accepts the compiler channel and an absent field', () => {
    const config = validateConfig({
      name: SYSTEM_NAME,
      include: DEFAULT_INCLUDE,
      logs: ['compiler'],
    })

    expect(config.logs).toEqual(['compiler'])

    const absent = validateConfig({
      name: SYSTEM_NAME,
      include: DEFAULT_INCLUDE,
    })

    expect(absent.logs).toBeUndefined()
  })

  it('rejects unknown channels and non-array shapes', () => {
    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        logs: ['bogus'] as never,
      })
    ).toThrowError(/'logs' must be an array of log channels/i)

    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        logs: 'compiler' as never,
      })
    ).toThrowError(/'logs' must be an array of log channels/i)
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
