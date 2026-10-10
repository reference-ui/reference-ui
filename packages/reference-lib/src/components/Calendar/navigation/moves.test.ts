import { describe, expect, it } from 'vitest'
import {
  resolveArrowTarget,
  resolveHomeEndTarget,
  resolvePageTarget,
  skipToFocusable,
} from './moves'

const open: (date: string) => boolean = () => false
const DOMAIN = { min: '0001-01-01', max: '9999-12-31' } as const

describe('day-grid keyboard moves', () => {
  it('skips blocked dates without wrapping, stopping at the bounds', () => {
    const blocked = new Set(['2024-08-16', '2024-08-17'])
    expect(
      skipToFocusable('2024-08-16', 1, DOMAIN.min, DOMAIN.max, (d) => blocked.has(d))
    ).toBe('2024-08-18')
    expect(skipToFocusable('2024-08-16', 1, DOMAIN.min, '2024-08-16', (d) => blocked.has(d))).toBe(
      null
    )
    expect(skipToFocusable('2024-08-15', 1, DOMAIN.min, DOMAIN.max, open)).toBe('2024-08-15')
  })

  it('steps arrows a day, a week vertically, mirrored under RTL', () => {
    expect(
      resolveArrowTarget('2024-08-15', 'ArrowLeft', false, DOMAIN.min, DOMAIN.max, open)
    ).toBe('2024-08-14')
    expect(resolveArrowTarget('2024-08-15', 'ArrowLeft', true, DOMAIN.min, DOMAIN.max, open)).toBe(
      '2024-08-16'
    )
    expect(
      resolveArrowTarget('2024-08-15', 'ArrowUp', false, DOMAIN.min, DOMAIN.max, open)
    ).toBe('2024-08-08')
    expect(resolveArrowTarget('2024-08-15', 'ArrowUp', true, DOMAIN.min, DOMAIN.max, open)).toBe(
      '2024-08-08'
    )
  })

  it('lands the locale week boundary, skipping inward past blocked dates', () => {
    // 2024-08-15 is a Thursday; Sunday-first Home lands Sunday 08-11.
    expect(resolveHomeEndTarget('2024-08-15', 'Home', 0, open)).toBe('2024-08-11')
    expect(resolveHomeEndTarget('2024-08-15', 'End', 0, open)).toBe('2024-08-17')
    const blocked = new Set(['2024-08-11'])
    expect(resolveHomeEndTarget('2024-08-15', 'Home', 0, (d) => blocked.has(d))).toBe('2024-08-12')
  })

  it('pages a month preserving the day, constrained at month end', () => {
    expect(resolvePageTarget('2024-08-15', 1, DOMAIN.min, DOMAIN.max, open)).toBe('2024-09-15')
    expect(resolvePageTarget('2024-08-31', 1, DOMAIN.min, DOMAIN.max, open)).toBe('2024-09-30')
    expect(resolvePageTarget('2024-01-15', -1, DOMAIN.min, DOMAIN.max, open)).toBe('2023-12-15')
    expect(resolvePageTarget('0001-01-15', -1, DOMAIN.min, DOMAIN.max, open)).toBe(null)
  })
})
