// Unit tests for the Core config validator over the surviving fields.
// They take candidate configs and assert accept or typed rejection.

import { describe, expect, it } from 'vitest'
import { defineConfig } from './types.ts'
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

  it('ignores unknown fields as the retired reference-core does today', () => {
    // layers, strict and the MCP fields are known fields now; only genuinely
    // unknown fields ride this test.
    const config = validateConfig({
      name: SYSTEM_NAME,
      include: DEFAULT_INCLUDE,
      skipTypescript: true,
    })

    expect(config.name).toBe(SYSTEM_NAME)
    expect(config.include).toEqual(DEFAULT_INCLUDE)
  })
})

describe('validateConfig MCP fields', () => {
  it('types and passes through the ui.config fields the MCP server reads', () => {
    // defineConfig is the typed guard: the package typecheck fails if any of
    // these documented fields leaves ReferenceUIConfig.
    const authored = defineConfig({
      name: SYSTEM_NAME,
      include: DEFAULT_INCLUDE,
      mcp: { include: ['src/**'], exclude: ['src/internal/**'] },
      use_reference_library: false,
      use_reference_icons: false,
      useReferenceLibrary: false,
      useReferenceIcons: false,
    })

    expect(validateConfig(authored)).toEqual(authored)
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

describe('validateConfig strict', () => {
  it('accepts a category list and carries it on the returned config', () => {
    const config = validateConfig({
      name: SYSTEM_NAME,
      include: DEFAULT_INCLUDE,
      strict: ['colors'],
    })

    expect(config.strict).toEqual(['colors'])
  })

  it('accepts all three categories, repeated entries, and an empty list', () => {
    const all = validateConfig({
      name: SYSTEM_NAME,
      include: DEFAULT_INCLUDE,
      strict: ['colors', 'radii', 'spacing'],
    })
    expect(all.strict).toEqual(['colors', 'radii', 'spacing'])

    const repeated = validateConfig({
      name: SYSTEM_NAME,
      include: DEFAULT_INCLUDE,
      strict: ['radii', 'radii'],
    })
    expect(repeated.strict).toEqual(['radii', 'radii'])

    const empty = validateConfig({
      name: SYSTEM_NAME,
      include: DEFAULT_INCLUDE,
      strict: [],
    })
    expect(empty.strict).toEqual([])
  })

  it('leaves the field absent in open mode', () => {
    const config = validateConfig({
      name: SYSTEM_NAME,
      include: DEFAULT_INCLUDE,
    })

    expect(config.strict).toBeUndefined()
  })

  it('rejects non-array shapes', () => {
    for (const strict of ['colors', 42, { colors: true }]) {
      expect(() =>
        validateConfig({ name: SYSTEM_NAME, include: DEFAULT_INCLUDE, strict: strict as never })
      ).toThrowError(/'strict' must be an array of token categories/i)
    }
  })

  it('rejects entries outside colors, radii, and spacing', () => {
    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        strict: ['tones'] as never,
      })
    ).toThrowError(/Config field 'strict' is invalid/)

    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        strict: ['colors', 7] as never,
      })
    ).toThrowError(/'strict' must be an array of token categories/i)
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

// extends and layers are checked independently: a bad extends must not hide a bad layers.
describe('validateConfig base-system fields report together', () => {
  it('reports both bad fields, extends first, with each field message intact', () => {
    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        extends: [null],
        layers: {},
      })
    ).toThrowError(
      /^Config field 'extends' is invalid\.\nEntry 0 must be an object\.\n\nConfig field 'layers' is invalid\.\nExpected an array of BaseSystem objects\.$/
    )
  })

  it('reports a layers entry error alongside a repeat in extends', () => {
    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        extends: [
          { name: 'base', fragment: 'fragment-code' },
          { name: 'base', fragment: 'fragment-code' },
        ],
        layers: [{ name: SYSTEM_NAME, fragment: 'fragment-code', streams: [{ name: SYSTEM_NAME, preamble: '' }] }],
      })
    ).toThrowError(
      /^Config field 'extends' is invalid\.\nEntry 1 \(base\) repeats entry 0\. List each system once\.\n\nConfig field 'layers' is invalid\.\nEntry 0 \(my-system\) reaches 'my-system'/
    )
  })

  it('keeps a single bad field message exactly as it reads alone', () => {
    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        layers: {},
      })
    ).toThrowError(/^Config field 'layers' is invalid\.\nExpected an array of BaseSystem objects\.$/)

    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        extends: {},
      })
    ).toThrowError(/^Config field 'extends' is invalid\.\nExpected an array of BaseSystem objects\.$/)
  })
})

describe('validateConfig include brace limits', () => {
  const nest = (levels: number): string => `src/${'{a,'.repeat(levels)}b${'}'.repeat(levels)}.ts`
  const withInclude = (include: string[]) => ({ name: SYSTEM_NAME, include })

  it('passes {a,b} written 10 times and refuses 11, naming the pattern', () => {
    const wide = `src/${'{a,b}'.repeat(11)}`

    expect(() => validateConfig(withInclude([`src/${'{a,b}'.repeat(10)}`]))).not.toThrow()
    expect(() => validateConfig(withInclude([wide]))).toThrowError(
      `Config field 'include' is invalid.\ninclude pattern '${wide}' expands to more than 1,024 globs`
    )
  })

  it('passes 64 nesting levels and refuses 65, naming the pattern', () => {
    expect(() => validateConfig(withInclude([nest(64)]))).not.toThrow()
    expect(() => validateConfig(withInclude([nest(65)]))).toThrowError(
      `include pattern '${nest(65)}' nests braces deeper than 64 levels`
    )
  })

  it('checks a negated pattern by its body and names it whole', () => {
    const negated = `!src/${'{a,b}'.repeat(11)}`

    expect(() => validateConfig(withInclude(['src/**/*.ts', negated]))).toThrowError(
      `include pattern '${negated}' expands to more than 1,024 globs`
    )
  })

  it('does not count escaped braces, so the backslash is what refuses them', () => {
    expect(() => validateConfig(withInclude([`src/${'\\{a,b\\}'.repeat(24)}`]))).toThrowError(/uses a backslash/)
  })

  it.each([5_000, 50_000])('refuses %i sequential {a,b} pairs by name, not with a RangeError', (pairs) => {
    const wide = `src/${'{a,b}'.repeat(pairs)}`

    expect(() => validateConfig(withInclude([wide]))).toThrowError(
      `Config field 'include' is invalid.\ninclude pattern '${wide}' expands to more than 1,024 globs`
    )
  })

  it.each([5_000, 50_000])('passes %i sequential commaless {x} pairs', (pairs) => {
    expect(() => validateConfig(withInclude([`src/${'{x}'.repeat(pairs)}`]))).not.toThrow()
  })
})
