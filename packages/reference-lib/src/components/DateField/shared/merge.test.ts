/**
 * Prop-merge proof: part-resolution merging across root and explicit
 * props. Pure merge decisions; the slot layouts consume them.
 */
import { describe, expect, it } from 'vitest'
import { mergeClassNames, mergeStyles } from './merge'

describe('prop merging', () => {
  it('joins the defined class legs, undefined when all are empty', () => {
    expect(mergeClassNames('a', undefined, 'b', null, false)).toBe('a b')
    expect(mergeClassNames(undefined, null, false)).toBeUndefined()
    expect(mergeClassNames()).toBeUndefined()
  })

  it('layers the defined style legs, later legs winning', () => {
    expect(mergeStyles({ color: 'red' }, undefined, { color: 'blue', margin: 0 })).toEqual({
      color: 'blue',
      margin: 0,
    })
    expect(mergeStyles(undefined)).toBeUndefined()
    expect(mergeStyles()).toBeUndefined()
  })
})
