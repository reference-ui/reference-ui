/**
 * Proof for the deterministic expansion reducer. Pins document-ordered
 * emission with unknown values trailing, collapse by removal, dedupe of
 * unknowns, and batch sibling sets folded into one ordered payload.
 */
import { describe, expect, it } from 'vitest'
import { getBatchExpanded, getDeterministicExpanded } from './deterministic'

describe('getDeterministicExpanded', () => {
  it('expands into document order with unknown values trailing', () => {
    expect(getDeterministicExpanded(['b'], 'a', ['a', 'b', 'c'], true)).toEqual(['a', 'b'])
    expect(getDeterministicExpanded(['zzz', 'c'], 'a', ['a', 'b', 'c'], true)).toEqual([
      'a',
      'c',
      'zzz',
    ])
  })

  it('collapses by removing the branch and keeping the rest ordered', () => {
    expect(getDeterministicExpanded(['a', 'b'], 'a', ['a', 'b', 'c'], false)).toEqual(['b'])
    expect(getDeterministicExpanded(['zzz', 'a'], 'a', ['a', 'b'], false)).toEqual(['zzz'])
  })

  it('dedupes unknown values and tolerates unknown branches', () => {
    expect(getDeterministicExpanded(['zzz', 'zzz'], 'q', ['a'], true)).toEqual(['q', 'zzz'])
  })
})

describe('getBatchExpanded', () => {
  it('folds a sibling set into one ordered emission', () => {
    expect(getBatchExpanded([], ['c', 'a'], ['a', 'b', 'c'])).toEqual(['a', 'c'])
  })

  it('skips already-expanded ids without emitting noise', () => {
    expect(getBatchExpanded(['a'], ['a', 'b'], ['a', 'b'])).toEqual(['a', 'b'])
  })
})
