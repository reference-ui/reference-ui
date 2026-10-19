/**
 * Proof for nearest-enabled tab fallback. Pins identity for enabled
 * values, outward walks with preceding-tab ties, follower fallback, first-
 * enabled for unknown values, and undefined when nothing is enabled.
 */
import { describe, expect, it } from 'vitest'
import { nearestEnabledValue } from './nearest'

describe('nearestEnabledValue', () => {
  it('returns the value itself when enabled', () => {
    expect(nearestEnabledValue('b', ['a', 'b', 'c'], ['a', 'b', 'c'])).toBe('b')
  })

  it('walks outward with ties going to the preceding tab', () => {
    expect(nearestEnabledValue('b', ['a', 'c'], ['a', 'b', 'c'])).toBe('a')
  })

  it('falls to the follower when nothing precedes', () => {
    expect(nearestEnabledValue('a', ['b', 'c'], ['a', 'b', 'c'])).toBe('b')
  })

  it('falls back to first-enabled for unknown values', () => {
    expect(nearestEnabledValue('zzz', ['a', 'b'], ['a', 'b'])).toBe('a')
  })

  it('returns undefined when nothing is enabled', () => {
    expect(nearestEnabledValue('a', [], ['a', 'b'])).toBeUndefined()
  })

  it('walks an override order for removals', () => {
    expect(nearestEnabledValue('b', ['a', 'c'], ['a', 'b', 'c'])).toBe('a')
    expect(nearestEnabledValue('b', ['c'], ['a', 'c'])).toBe('c')
  })
})
