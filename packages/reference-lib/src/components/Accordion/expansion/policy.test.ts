/** Expansion-policy proof: openness reads, single/multiple toggles, shape guards. */
import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  assertValueShape,
  isItemOpenInValue,
  nextMultipleValue,
  nextSingleValue,
} from './policy'

describe('isItemOpenInValue', () => {
  it('reads single openness by identity and multiple by membership', () => {
    expect(isItemOpenInValue('single', 'a', 'a')).toBe(true)
    expect(isItemOpenInValue('single', 'a', 'b')).toBe(false)
    expect(isItemOpenInValue('single', null, 'a')).toBe(false)
    expect(isItemOpenInValue('multiple', ['a', 'b'], 'b')).toBe(true)
    expect(isItemOpenInValue('multiple', ['a'], 'b')).toBe(false)
    expect(isItemOpenInValue('multiple', [], 'a')).toBe(false)
  })

  it('treats a non-array multiple value as closed for every id', () => {
    expect(isItemOpenInValue('multiple', 'a' as never, 'a')).toBe(false)
    expect(isItemOpenInValue('multiple', null, 'a')).toBe(false)
  })
})

describe('nextSingleValue', () => {
  it('toggles between the id and the all-collapsed null', () => {
    expect(nextSingleValue(null, 'a')).toBe('a')
    expect(nextSingleValue('a', 'a')).toBeNull()
    expect(nextSingleValue('b', 'a')).toBe('a')
  })
})

describe('nextMultipleValue', () => {
  it('adds and removes the toggled id', () => {
    expect(nextMultipleValue([], 'a', ['a', 'b'])).toEqual(['a'])
    expect(nextMultipleValue(['a', 'b'], 'a', ['a', 'b'])).toEqual(['b'])
  })

  it('canonicalizes known ids into DOM/authored order (AC-MULTI-04)', () => {
    expect(nextMultipleValue(['c', 'a'], 'b', ['a', 'b', 'c'])).toEqual(['a', 'b', 'c'])
  })

  it('keeps unknown ids in incoming relative order after the known ones', () => {
    expect(nextMultipleValue(['z', 'a'], 'y', ['a', 'b'])).toEqual(['a', 'z', 'y'])
  })

  it('treats a non-array current value as the empty set', () => {
    expect(nextMultipleValue(null, 'a', ['a'])).toEqual(['a'])
    expect(nextMultipleValue('a' as never, 'b', ['a', 'b'])).toEqual(['b'])
  })
})

describe('assertValueShape', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('accepts matching mode/value pairs silently', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => assertValueShape('single', undefined)).not.toThrow()
    expect(() => assertValueShape('single', null)).not.toThrow()
    expect(() => assertValueShape('single', 'a')).not.toThrow()
    expect(() => assertValueShape('multiple', undefined)).not.toThrow()
    expect(() => assertValueShape('multiple', [])).not.toThrow()
    expect(() => assertValueShape('multiple', ['a'])).not.toThrow()
    expect(error).not.toHaveBeenCalled()
  })

  it('throws and reports an incompatible single value (AC-MULTI-06)', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => assertValueShape('single', ['a'] as never)).toThrow(
      '[Reference UI Accordion] Incompatible mode/value pair: expansion="single" requires a string or null value, received object.'
    )
    expect(error).toHaveBeenCalledTimes(1)
  })

  it('throws and reports an incompatible multiple value (AC-MULTI-06)', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => assertValueShape('multiple', 'a')).toThrow(
      '[Reference UI Accordion] Incompatible mode/value pair: expansion="multiple" requires an array value, received string.'
    )
    expect(() => assertValueShape('multiple', null)).toThrow(
      '[Reference UI Accordion] Incompatible mode/value pair: expansion="multiple" requires an array value, received object.'
    )
    expect(error).toHaveBeenCalledTimes(2)
  })
})
