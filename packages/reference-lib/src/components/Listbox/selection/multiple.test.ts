/**
 * Multi-toggle proof: computeNextMultipleSelection across toggles,
 * unknowns, and collection order. Pure reducer with no DOM; the
 * selection hook consumes it.
 */
import { describe, expect, it } from 'vitest'
import { computeNextMultipleSelection } from './multiple'

describe('computeNextMultipleSelection', () => {
  it('selects into collection order regardless of toggle sequence', () => {
    expect(computeNextMultipleSelection(['a'], 'c', ['a', 'b', 'c'])).toEqual(['a', 'c'])
    expect(computeNextMultipleSelection(['c'], 'a', ['a', 'b', 'c'])).toEqual(['a', 'c'])
  })

  it('deselects by removing the toggled value', () => {
    expect(computeNextMultipleSelection(['a', 'b'], 'a', ['a', 'b', 'c'])).toEqual(['b'])
    expect(computeNextMultipleSelection(['a'], 'a', ['a', 'b'])).toEqual([])
  })

  it('starts from an empty selection when the current value is nullish or single', () => {
    expect(computeNextMultipleSelection(null, 'b', ['a', 'b'])).toEqual(['b'])
    expect(computeNextMultipleSelection(undefined, 'b', ['a', 'b'])).toEqual(['b'])
    expect(computeNextMultipleSelection('a', 'b', ['a', 'b'])).toEqual(['b'])
  })

  it('appends unknown values after known ones in encounter order', () => {
    expect(computeNextMultipleSelection(['zzz', 'a'], 'b', ['a', 'b'])).toEqual(['a', 'b', 'zzz'])
    expect(computeNextMultipleSelection(['a'], 'zzz', ['a', 'b'])).toEqual(['a', 'zzz'])
  })

  it('drops unknown values once toggled off', () => {
    expect(computeNextMultipleSelection(['zzz', 'a'], 'zzz', ['a', 'b'])).toEqual(['a'])
  })
})
