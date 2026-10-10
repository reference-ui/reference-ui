import { describe, expect, it } from 'vitest'
import { monthRangePaint, yearRangePaint } from './paints'

describe('collection range paint', () => {
  it('paints completed ranges inclusively on months', () => {
    const value = { start: '2024-06-15', end: '2024-08-15' }
    expect(monthRangePaint('2024-07', value)).toEqual({
      selected: true,
      rangeStart: false,
      rangeEnd: false,
      inRange: true,
    })
    expect(monthRangePaint('2024-06', value).rangeStart).toBe(true)
    expect(monthRangePaint('2024-08', value).rangeEnd).toBe(true)
    expect(monthRangePaint('2024-09', value).selected).toBe(false)
  })

  it('marks a pending start alone on months', () => {
    const value = { start: '2024-06-15', end: null }
    expect(monthRangePaint('2024-06', value)).toEqual({
      selected: true,
      rangeStart: true,
      rangeEnd: false,
      inRange: false,
    })
    expect(monthRangePaint('2024-07', value).selected).toBe(false)
  })

  it('paints completed ranges inclusively on years', () => {
    const value = { start: '2022-06-15', end: '2024-08-15' }
    expect(yearRangePaint(2023, value).inRange).toBe(true)
    expect(yearRangePaint(2022, value).rangeStart).toBe(true)
    expect(yearRangePaint(2024, value).rangeEnd).toBe(true)
    expect(yearRangePaint(2025, value).selected).toBe(false)
  })

  it('stays empty for non-range values', () => {
    expect(monthRangePaint('2024-06', '2024-08-15')).toEqual({
      selected: false,
      rangeStart: false,
      rangeEnd: false,
      inRange: false,
    })
    expect(yearRangePaint(2024, null)).toEqual({
      selected: false,
      rangeStart: false,
      rangeEnd: false,
      inRange: false,
    })
  })
})
