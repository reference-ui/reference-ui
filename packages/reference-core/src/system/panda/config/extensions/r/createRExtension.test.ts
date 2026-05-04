import { describe, expect, it } from 'vitest'
import { createRExtension } from './createRExtension'

describe('createRExtension', () => {
  it('declares the r property on the box pattern', () => {
    const ext = createRExtension({})
    expect(ext.properties).toEqual({ r: { type: 'object' } })
  })

  it('returns an empty object when r is absent', () => {
    const ext = createRExtension({ md: '768' })
    expect(ext.transform({})).toEqual({})
  })

  it('lowers numeric breakpoint keys to container queries', () => {
    const ext = createRExtension({})
    const result = ext.transform({
      r: { 768: { padding: '4' }, 1280: { padding: '6' } },
    })
    expect(result).toEqual({
      '@container (min-width: 768px)': { padding: '4' },
      '@container (min-width: 1280px)': { padding: '6' },
    })
  })

  it('lowers named breakpoint keys using the breakpoint table', () => {
    const ext = createRExtension({ md: '768', xl: '1280' })
    const result = ext.transform({
      r: { md: { padding: '4' }, xl: { padding: '6' } },
    })
    expect(result).toEqual({
      '@container (min-width: 768px)': { padding: '4' },
      '@container (min-width: 1280px)': { padding: '6' },
    })
  })

  it('accepts a mix of named and numeric keys', () => {
    const ext = createRExtension({ md: '768' })
    expect(
      ext.transform({ r: { md: { padding: '4' }, 1280: { padding: '6' } } })
    ).toEqual({
      '@container (min-width: 768px)': { padding: '4' },
      '@container (min-width: 1280px)': { padding: '6' },
    })
  })

  it('throws on unknown named breakpoints', () => {
    const ext = createRExtension({ md: '768' })
    expect(() => ext.transform({ r: { wat: { padding: '4' } } })).toThrow(
      /Unknown breakpoint name in r prop: "wat"/
    )
  })

  it('uses a named container when container prop is provided', () => {
    const ext = createRExtension({ md: '768' })
    const result = ext.transform({ container: 'card', r: { md: { padding: '4' } } })
    expect(result).toEqual({
      '@container card (min-width: 768px)': { padding: '4' },
    })
  })

  it('survives transform.toString() rebuilding (closure-free body)', () => {
    const ext = createRExtension({ md: '768' })
    const source = ext.transform.toString()
    const bodyStart = source.indexOf('{')
    const bodyEnd = source.lastIndexOf('}')
    const body = source.slice(bodyStart + 1, bodyEnd)
    const rebuilt = new Function('props', body) as typeof ext.transform
    expect(rebuilt({ r: { md: { padding: '4' } } })).toEqual({
      '@container (min-width: 768px)': { padding: '4' },
    })
  })
})
