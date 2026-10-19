/**
 * Typeahead proof: buffer advance and wrapping match order. Pure search
 * with no DOM; the typeahead hook consumes it.
 */
import { describe, expect, it } from 'vitest'
import {
  advanceTypeaheadQuery,
  findTypeaheadMatchAfter,
  findTypeaheadMatchFrom,
  typeaheadStartsWith,
} from './search'

const collator = new Intl.Collator(undefined, { sensitivity: 'accent', usage: 'search' })
const texts = ['apple', 'apricot', 'banana', 'blueberry']

describe('advanceTypeaheadQuery', () => {
  it('extends the buffer on a fresh key', () => {
    expect(advanceTypeaheadQuery('ap', 'p', 'apple', collator)).toEqual({
      query: 'app',
      cycling: false,
    })
  })

  it('cycles on a repeat character instead of extending', () => {
    expect(advanceTypeaheadQuery('b', 'b', 'banana', collator)).toEqual({
      query: 'b',
      cycling: true,
    })
  })

  it('cycles on an empty buffer when the current item already starts with the key', () => {
    expect(advanceTypeaheadQuery('', 'b', 'banana', collator)).toEqual({
      query: 'b',
      cycling: true,
    })
    expect(advanceTypeaheadQuery('', 'c', 'banana', collator)).toEqual({
      query: 'c',
      cycling: false,
    })
  })
})

describe('typeahead match order', () => {
  it('matches case-insensitively on the prefix', () => {
    expect(typeaheadStartsWith('banana', 'B', collator)).toBe(true)
    expect(typeaheadStartsWith('apple', 'app', collator)).toBe(true)
    expect(typeaheadStartsWith('ap', 'apple', collator)).toBe(false)
  })

  it('searches after the current position first, then wraps (cycle order)', () => {
    expect(findTypeaheadMatchAfter(texts, 'b', 1, collator)).toBe(2)
    expect(findTypeaheadMatchAfter(texts, 'b', 2, collator)).toBe(3)
    expect(findTypeaheadMatchAfter(texts, 'b', 3, collator)).toBe(2)
    expect(findTypeaheadMatchAfter(texts, 'z', 0, collator)).toBe(-1)
  })

  it('searches from the current position first, then wraps (extend order)', () => {
    expect(findTypeaheadMatchFrom(texts, 'ap', 1, collator)).toBe(1)
    expect(findTypeaheadMatchFrom(texts, 'ap', 2, collator)).toBe(0)
    expect(findTypeaheadMatchFrom(texts, 'z', 0, collator)).toBe(-1)
  })
})
