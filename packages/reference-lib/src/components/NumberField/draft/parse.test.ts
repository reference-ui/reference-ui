/**
 * Proof for the draft parser: plain, grouped, and locale numbers parse,
 * foreign punctuation and malformed grammar reject. Pins exponents,
 * percent scaling, affix stripping, and sign/double rejection.
 */
import { describe, expect, it } from 'vitest'
import { isImpossibleInsertion, isValidGroupHead, parseDraftNumber } from './parse'
import { draftNumberSymbols } from './symbols'

const en = draftNumberSymbols('en-US')
const de = draftNumberSymbols('de-DE')

describe('draft parser', () => {
  it('parses plain and grouped western numbers', () => {
    expect(parseDraftNumber('42', en, false)).toBe(42)
    expect(parseDraftNumber('1,000.5', en, false)).toBe(1000.5)
    expect(parseDraftNumber('-12', en, false)).toBe(-12)
  })

  it('parses locale separators and rejects foreign punctuation', () => {
    expect(parseDraftNumber('1.234,5', de, false)).toBe(1234.5)
    expect(parseDraftNumber('2.5', de, false)).toBeNaN()
    expect(parseDraftNumber('1,234,567', draftNumberSymbols('en-IN'), false)).toBeNaN()
  })

  it('rejects incomplete grammar, doubles, and embedded signs', () => {
    expect(parseDraftNumber('1.', en, false)).toBeNaN()
    expect(parseDraftNumber('++5', en, false)).toBeNaN()
    expect(parseDraftNumber('5-3', en, false)).toBeNaN()
    expect(parseDraftNumber('abc', en, false)).toBeNaN()
    expect(parseDraftNumber('  12', en, false)).toBeNaN()
  })

  it('parses exponents and scales percent style', () => {
    expect(parseDraftNumber('1e3', en, false)).toBe(1000)
    expect(parseDraftNumber('12', en, true)).toBe(0.12)
  })

  it('strips configured affixes in locale order', () => {
    const usd = draftNumberSymbols('en-US', { style: 'currency', currency: 'USD' })
    expect(parseDraftNumber('$5', usd, false)).toBe(5)
    expect(parseDraftNumber('-$5', usd, false)).toBe(-5)
    expect(parseDraftNumber('$$5', usd, false)).toBeNaN()
  })

  it('validates group heads against the locale pattern', () => {
    expect(isValidGroupHead(['1', '234', '567'], { units: 3, middle: 3 })).toBe(true)
    expect(isValidGroupHead(['12', '34', '567'], { units: 3, middle: 3 })).toBe(false)
    expect(isValidGroupHead(['1', '23', '456'], { units: 3, middle: 2 })).toBe(true)
  })

  it('cancels only impossible insertions at keystroke time', () => {
    // Letters (other than one well-placed exponent e) cancel.
    expect(isImpossibleInsertion('', 0, 0, 'a', en)).toBe(true)
    expect(isImpossibleInsertion('1', 1, 1, 'e', en)).toBe(false)
    expect(isImpossibleInsertion('', 0, 0, 'e', en)).toBe(true)
    // Duplicate decimals and second/misplaced signs cancel.
    expect(isImpossibleInsertion('1.5', 3, 3, '.', en)).toBe(true)
    expect(isImpossibleInsertion('5', 1, 1, '-', en)).toBe(true)
    expect(isImpossibleInsertion('5', 0, 0, '-', en)).toBe(false)
    // Digits and valid partials always stage.
    expect(isImpossibleInsertion('', 0, 0, '3', en)).toBe(false)
    expect(isImpossibleInsertion('1', 1, 1, '.', en)).toBe(false)
  })
})
