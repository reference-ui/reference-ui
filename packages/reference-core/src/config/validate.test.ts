import { beforeEach, describe, expect, it, vi } from 'vitest'

const { info } = vi.hoisted(() => ({
  info: vi.fn(),
}))

vi.mock('../lib/log', () => ({
  log: { info },
}))

import { validateConfig } from './validate'

const SYSTEM_NAME = 'my-system'
const DEFAULT_INCLUDE = ['src/**/*.{ts,tsx}']
const FRAGMENT_CODE = 'fragment-code'
const LAYERS_CSS = '.root { color: red; }'
const LAYERS_WARNING =
  '[config] Warning: layers entry "upstream" has no css field. Run `ref sync` on the upstream package first.'

describe('validateConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

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

  it('requires extends to be an array of named systems with fragments', () => {
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
    ).toThrowError(/must include a non-empty 'fragment'/i)
  })

  it('requires layers to be an array of named systems', () => {
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
        layers: [{} as never],
      })
    ).toThrowError(/must have a non-empty 'name'/i)
  })

  it('warns when a layers entry has no css field', () => {
    const config = validateConfig({
      name: SYSTEM_NAME,
      include: DEFAULT_INCLUDE,
      layers: [{ name: 'upstream', fragment: FRAGMENT_CODE }],
    })

    expect(config.layers).toEqual([{ name: 'upstream', fragment: FRAGMENT_CODE }])
    expect(info).toHaveBeenCalledWith(LAYERS_WARNING)
  })

  it('accepts valid extends and layers entries without warnings', () => {
    const config = validateConfig({
      name: SYSTEM_NAME,
      include: DEFAULT_INCLUDE,
      extends: [{ name: 'base', fragment: FRAGMENT_CODE }],
      layers: [{ name: 'layered', fragment: FRAGMENT_CODE, css: LAYERS_CSS }],
    })

    expect(config.extends).toEqual([{ name: 'base', fragment: FRAGMENT_CODE }])
    expect(config.layers).toEqual([
      { name: 'layered', fragment: FRAGMENT_CODE, css: LAYERS_CSS },
    ])
    expect(info).not.toHaveBeenCalled()
  })

  it('accepts a dedicated mcp include/exclude config', () => {
    const config = validateConfig({
      name: SYSTEM_NAME,
      include: DEFAULT_INCLUDE,
      mcp: {
        include: ['src/components/**/*.{ts,tsx}'],
        exclude: ['src/components/internal/**'],
      },
    })

    expect(config.mcp).toEqual({
      include: ['src/components/**/*.{ts,tsx}'],
      exclude: ['src/components/internal/**'],
    })
  })

  it('rejects invalid mcp config shapes', () => {
    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        mcp: [] as never,
      })
    ).toThrowError(/field 'mcp' is invalid/i)

    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        mcp: {
          include: [123],
        } as never,
      })
    ).toThrowError(/mcp\.include/i)
  })
})
