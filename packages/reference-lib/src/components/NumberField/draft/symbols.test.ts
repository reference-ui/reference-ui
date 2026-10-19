/**
 * Proof for the draft alphabet derived from Intl probes. Pins western and
 * locale separators, en-IN grouping, ten positional digits per numbering
 * system, and refusal of unstable systems and foreign digits.
 */
import { describe, expect, it } from 'vitest'
import {
  draftDigits,
  draftGroupSizes,
  draftNumberSymbols,
  isEqualFormatOptions,
  normalizeDraftDigits,
} from './symbols'

describe('draft alphabet', () => {
  it('derives western separators, ASCII digits, and 3-3 groups for en-US', () => {
    const symbols = draftNumberSymbols('en-US')
    expect(symbols.group).toBe(',')
    expect(symbols.decimal).toBe('.')
    expect(symbols.digits).toBe('0123456789')
    expect(symbols.groupSizes).toEqual({ units: 3, middle: 3 })
    expect(symbols.accounting).toBe(false)
  })

  it('derives locale separators and the en-IN 3-2 pattern', () => {
    const symbols = draftNumberSymbols('de-DE')
    expect(symbols.group).toBe('.')
    expect(symbols.decimal).toBe(',')
    expect(draftGroupSizes('en-IN')).toEqual({ units: 3, middle: 2 })
  })

  it('resolves ten positional digits per numbering system', () => {
    expect(draftDigits('en-US')).toBe('0123456789')
    expect(draftDigits('ar-EG')).toBe('٠١٢٣٤٥٦٧٨٩')
  })

  it('refuses numbering systems without ten stable positional digits', () => {
    expect(() => draftDigits('en-US-u-nu-roman')).toThrow(/not editable/)
  })

  it('normalizes active-system glyphs and rejects foreign digits', () => {
    expect(normalizeDraftDigits('١٢٣', '٠١٢٣٤٥٦٧٨٩')).toBe('123')
    expect(normalizeDraftDigits('12٣', '0123456789')).toBeNull()
    expect(normalizeDraftDigits('1٢3', '0123456789')).toBeNull()
  })

  it('compares format options shallowly for session preservation', () => {
    expect(isEqualFormatOptions(undefined, undefined)).toBe(true)
    expect(isEqualFormatOptions({ style: 'percent' }, { style: 'percent' })).toBe(true)
    expect(isEqualFormatOptions({ style: 'percent' }, { style: 'decimal' })).toBe(false)
    expect(isEqualFormatOptions({ style: 'percent' }, undefined)).toBe(false)
  })
})
