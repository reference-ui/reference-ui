import { describe, expect, it } from 'vitest'
import { extractBreakpointTable } from './extractBreakpointTable'

describe('extractBreakpointTable', () => {
  it('returns empty table when no fragments contain breakpoints', () => {
    expect(extractBreakpointTable([])).toEqual({})
    expect(extractBreakpointTable([{}, { colors: { red: { value: '#f00' } } }])).toEqual({})
  })

  it('extracts pixel widths from token fragments stripping the px suffix', () => {
    const table = extractBreakpointTable([
      {
        breakpoints: {
          md: { value: '768px' },
          xl: { value: '1280px' },
        },
      },
    ])
    expect(table).toEqual({ md: '768', xl: '1280' })
  })

  it('merges across fragments preserving last-write-wins', () => {
    const table = extractBreakpointTable([
      { breakpoints: { md: { value: '700px' } } },
      { breakpoints: { md: { value: '768px' }, lg: { value: '1024px' } } },
    ])
    expect(table).toEqual({ md: '768', lg: '1024' })
  })

  it('accepts plain numeric strings and numbers', () => {
    expect(
      extractBreakpointTable([{ breakpoints: { sm: '640', md: 768 } }])
    ).toEqual({ sm: '640', md: '768' })
  })

  it('throws on non-px units', () => {
    expect(() =>
      extractBreakpointTable([{ breakpoints: { md: { value: '48em' } } }])
    ).toThrow(/must be expressed in px/)
  })

  it('throws on non-string non-number values', () => {
    expect(() =>
      extractBreakpointTable([{ breakpoints: { md: { value: true as unknown } } }])
    ).toThrow(/must be a string in the form "<n>px"/)
  })

  it('skips null or non-object fragments safely', () => {
    expect(extractBreakpointTable([null, undefined, { breakpoints: { md: '768px' } }])).toEqual({
      md: '768',
    })
  })
})
