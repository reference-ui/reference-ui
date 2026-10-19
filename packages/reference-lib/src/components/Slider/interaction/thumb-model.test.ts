/**
 * Proof for the thumb presentation model. Pins active-thumb-on-top
 * stacking with lower-index-above idle order, Minimum/Maximum and
 * numbered-gang naming, and the aria-valuetext precedence chain.
 */
import { describe, expect, it } from 'vitest'
import { resolveAriaValueText, resolveDefaultAriaLabel, resolveThumbZIndex } from './thumb-model'

describe('thumb presentation model', () => {
  it('stacks the active thumb on top and lower indexes above when idle', () => {
    expect(resolveThumbZIndex({ activeThumbIndex: 1, index: 1, thumbCount: 2 })).toBe(2)
    expect(resolveThumbZIndex({ activeThumbIndex: 1, index: 0, thumbCount: 2 })).toBe(1)
    expect(resolveThumbZIndex({ activeThumbIndex: null, index: 0, thumbCount: 3 })).toBe(3)
    expect(resolveThumbZIndex({ activeThumbIndex: null, index: 2, thumbCount: 3 })).toBe(1)
  })

  it('names thumbs by convention: Minimum/Maximum pairs, numbered gangs, none solo', () => {
    expect(resolveDefaultAriaLabel({ thumbCount: 2, index: 0 })).toBe('Minimum')
    expect(resolveDefaultAriaLabel({ thumbCount: 2, index: 1 })).toBe('Maximum')
    expect(resolveDefaultAriaLabel({ thumbCount: 3, index: 1 })).toBe('Value 2 of 3')
    expect(resolveDefaultAriaLabel({ thumbCount: 1, index: 0 })).toBeUndefined()
  })

  it('applies the aria-valuetext precedence chain', () => {
    const base = {
      authoredAriaValueText: undefined,
      authoredValueText: undefined,
      authoredAriaNow: undefined,
      formatValue: undefined,
      ariaNow: 42,
    }
    expect(resolveAriaValueText({ ...base, authoredAriaValueText: 'hot' })).toBe('hot')
    expect(resolveAriaValueText({ ...base, authoredValueText: 'warm' })).toBe('warm')
    expect(
      resolveAriaValueText({ ...base, formatValue: (v: number) => `${v}%` })
    ).toBe('42%')
    // An authored aria-valuenow suppresses the formatted text.
    expect(
      resolveAriaValueText({ ...base, authoredAriaNow: 7, formatValue: (v: number) => `${v}%` })
    ).toBeUndefined()
  })
})
