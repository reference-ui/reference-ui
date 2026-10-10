import { describe, expect, it } from 'vitest'
import { getHomeView, monthFromValue, shiftMonth, systemMonth } from './pane'

describe('pane seating', () => {
  it('homes day/range to the day collection, month/year to their own', () => {
    expect(getHomeView('day')).toBe('day')
    expect(getHomeView('range')).toBe('day')
    expect(getHomeView('month')).toBe('month')
    expect(getHomeView('year')).toBe('year')
  })

  it('shifts across year boundaries', () => {
    expect(shiftMonth(2024, 0, -1)).toEqual({ year: 2023, month: 11 })
    expect(shiftMonth(2024, 11, 1)).toEqual({ year: 2025, month: 0 })
    expect(shiftMonth(2024, 5, 1)).toEqual({ year: 2024, month: 6 })
  })

  it('returns null past the 0001–9999 domain edge', () => {
    expect(shiftMonth(1, 0, -1)).toBeNull()
    expect(shiftMonth(9999, 11, 1)).toBeNull()
  })

  it('seats the pane on each value shape', () => {
    expect(monthFromValue('2024-08-15')).toEqual({ year: 2024, month: 7 })
    expect(monthFromValue('2024-08')).toEqual({ year: 2024, month: 7 })
    expect(monthFromValue('2024')).toEqual({ year: 2024, month: 0 })
    expect(monthFromValue({ start: '2024-08-15', end: null })).toEqual({ year: 2024, month: 7 })
    expect(monthFromValue(null)).toBeNull()
  })

  it('reads the current UTC month as the last-resort seed', () => {
    const now = new Date()
    expect(systemMonth()).toEqual({ year: now.getUTCFullYear(), month: now.getUTCMonth() })
  })
})
