import { beforeEach, describe, expect, it, vi } from 'vitest'

const { info } = vi.hoisted(() => ({
  info: vi.fn(),
}))

vi.mock('../lib/log', () => ({
  log: { info },
}))

import { validateConfig } from './validate'

describe('validateConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('unwraps a default export object', () => {
    const config = validateConfig({
      default: {
        name: 'my-system',
        include: ['src/**/*.{ts,tsx}'],
      },
    })

    expect(config).toEqual({
      name: 'my-system',
      include: ['src/**/*.{ts,tsx}'],
    })
  })

  it('rejects non-object configs', () => {
    expect(() => validateConfig(null)).toThrowError(/must export a config object/i)
  })

  it('requires include to be an array', () => {
    expect(() =>
      validateConfig({
        name: 'my-system',
      })
    ).toThrowError(/must have an 'include' array/i)
  })

  it('requires name to be a non-empty string', () => {
    expect(() =>
      validateConfig({
        name: '   ',
        include: ['src/**/*.{ts,tsx}'],
      })
    ).toThrowError(/must have a non-empty 'name'/i)
  })

  it('rejects names with quotes or newlines', () => {
    expect(() =>
      validateConfig({
        name: 'bad"name',
        include: ['src/**/*.{ts,tsx}'],
      })
    ).toThrowError(/safe for CSS @layer/i)

    expect(() =>
      validateConfig({
        name: 'bad\nname',
        include: ['src/**/*.{ts,tsx}'],
      })
    ).toThrowError(/safe for CSS @layer/i)
  })

  it('requires extends to be an array of named systems with fragments', () => {
    expect(() =>
      validateConfig({
        name: 'my-system',
        include: ['src/**/*.{ts,tsx}'],
        extends: {} as never,
      })
    ).toThrowError(/field 'extends' is invalid/i)

    expect(() =>
      validateConfig({
        name: 'my-system',
        include: ['src/**/*.{ts,tsx}'],
        extends: [{} as never],
      })
    ).toThrowError(/must have a non-empty 'name'/i)

    expect(() =>
      validateConfig({
        name: 'my-system',
        include: ['src/**/*.{ts,tsx}'],
        extends: [{ name: 'upstream' } as never],
      })
    ).toThrowError(/must include a non-empty 'fragment'/i)
  })

  it('requires layers to be an array of named systems', () => {
    expect(() =>
      validateConfig({
        name: 'my-system',
        include: ['src/**/*.{ts,tsx}'],
        layers: {} as never,
      })
    ).toThrowError(/field 'layers' is invalid/i)

    expect(() =>
      validateConfig({
        name: 'my-system',
        include: ['src/**/*.{ts,tsx}'],
        layers: [{} as never],
      })
    ).toThrowError(/must have a non-empty 'name'/i)
  })

  it('warns when a layers entry has no css field', () => {
    const config = validateConfig({
      name: 'my-system',
      include: ['src/**/*.{ts,tsx}'],
      layers: [{ name: 'upstream', fragment: 'fragment-code' }],
    })

    expect(config.layers).toEqual([{ name: 'upstream', fragment: 'fragment-code' }])
    expect(info).toHaveBeenCalledWith(
      '[config] Warning: layers entry "upstream" has no css field. Run `ref sync` on the upstream package first.'
    )
  })

  it('accepts valid extends and layers entries without warnings', () => {
    const config = validateConfig({
      name: 'my-system',
      include: ['src/**/*.{ts,tsx}'],
      extends: [{ name: 'base', fragment: 'fragment-code' }],
      layers: [{ name: 'layered', fragment: 'fragment-code', css: '.root { color: red; }' }],
    })

    expect(config.extends).toEqual([{ name: 'base', fragment: 'fragment-code' }])
    expect(config.layers).toEqual([{ name: 'layered', fragment: 'fragment-code', css: '.root { color: red; }' }])
    expect(info).not.toHaveBeenCalled()
  })
})
