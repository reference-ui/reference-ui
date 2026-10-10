import { describe, expect, it } from 'vitest'
import { collectionKeyDelta } from './collection-keys'

describe('collectionKeyDelta', () => {
  it('steps one column horizontally, one row vertically', () => {
    expect(collectionKeyDelta('ArrowLeft', false)).toBe(-1)
    expect(collectionKeyDelta('ArrowRight', false)).toBe(1)
    expect(collectionKeyDelta('ArrowUp', false)).toBe(-3)
    expect(collectionKeyDelta('ArrowDown', false)).toBe(3)
  })

  it('reverses only the horizontal keys under RTL', () => {
    expect(collectionKeyDelta('ArrowLeft', true)).toBe(1)
    expect(collectionKeyDelta('ArrowRight', true)).toBe(-1)
    expect(collectionKeyDelta('ArrowUp', true)).toBe(-3)
    expect(collectionKeyDelta('ArrowDown', true)).toBe(3)
  })

  it('returns null for non-collection keys', () => {
    expect(collectionKeyDelta('Home', false)).toBeNull()
    expect(collectionKeyDelta('Enter', false)).toBeNull()
    expect(collectionKeyDelta('Tab', true)).toBeNull()
  })
})
