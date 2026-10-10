import { describe, expect, it } from 'vitest'
import {
  matchInRange,
  matchInRangeInclusive,
  matchRangeEnd,
  matchRangeStart,
  matchSelected,
  matchSelectedInclusive,
} from './matchers'

describe('selection matchers', () => {
  it('matches day-mode selection exactly', () => {
    expect(matchSelected('day', '2024-08-15', '2024-08-15')).toBe(true)
    expect(matchSelected('day', '2024-08-15', '2024-08-16')).toBe(false)
    expect(matchSelected('day', null, '2024-08-15')).toBe(false)
    expect(matchSelectedInclusive('day', '2024-08-15', '2024-08-15')).toBe(true)
  })

  it('matches range endpoints as selected, interior only inclusively', () => {
    const value = { start: '2024-08-15', end: '2024-08-18' }
    expect(matchSelected('range', value, '2024-08-15')).toBe(true)
    expect(matchSelected('range', value, '2024-08-18')).toBe(true)
    expect(matchSelected('range', value, '2024-08-16')).toBe(false)
    expect(matchSelectedInclusive('range', value, '2024-08-16')).toBe(true)
    expect(matchSelectedInclusive('range', value, '2024-08-19')).toBe(false)
  })

  it('normalizes a reversed controlled range for the inclusive band', () => {
    const value = { start: '2024-08-18', end: '2024-08-15' }
    expect(matchSelectedInclusive('range', value, '2024-08-16')).toBe(true)
    expect(matchInRangeInclusive('range', value, '2024-08-15')).toBe(true)
    expect(matchInRangeInclusive('range', value, '2024-08-18')).toBe(true)
  })

  it('keeps interior-only in-range strict and pending values bandless', () => {
    const value = { start: '2024-08-15', end: '2024-08-18' }
    expect(matchInRange('range', value, '2024-08-16')).toBe(true)
    expect(matchInRange('range', value, '2024-08-15')).toBe(false)
    expect(matchInRange('range', value, '2024-08-18')).toBe(false)
    const pending = { start: '2024-08-15', end: null }
    expect(matchInRange('range', pending, '2024-08-16')).toBe(false)
    expect(matchInRangeInclusive('range', pending, '2024-08-16')).toBe(false)
    expect(matchSelectedInclusive('range', pending, '2024-08-15')).toBe(true)
  })

  it('marks range start and end by identity', () => {
    const value = { start: '2024-08-15', end: '2024-08-18' }
    expect(matchRangeStart('range', value, '2024-08-15')).toBe(true)
    expect(matchRangeStart('range', value, '2024-08-18')).toBe(false)
    expect(matchRangeEnd('range', value, '2024-08-18')).toBe(true)
    expect(matchRangeEnd('range', value, '2024-08-15')).toBe(false)
  })

  it('stays false outside day/range modes', () => {
    expect(matchSelected('month', '2024-08', '2024-08-15')).toBe(false)
    expect(matchSelectedInclusive('year', '2024', '2024-08-15')).toBe(false)
    expect(matchInRange('month', '2024-08', '2024-08-16')).toBe(false)
    expect(matchInRangeInclusive('year', '2024', '2024-08-16')).toBe(false)
    expect(matchRangeStart('month', '2024-08', '2024-08-15')).toBe(false)
    expect(matchRangeEnd('year', '2024', '2024-08-15')).toBe(false)
  })
})
