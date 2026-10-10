import { describe, expect, it } from 'vitest'
import type { GridDay } from '../dates/grid'
import { computePreferredTarget, nearestFocusableTarget } from './targets'

function cell(date: string, outsideMonth = false): GridDay {
  const [year, month, day] = date.split('-').map(Number)
  return {
    date: date as GridDay['date'],
    year,
    month,
    day,
    outsideMonth,
    formattedDay: String(day),
    accessibleName: date,
  }
}

const days = ['2024-07-28', '2024-08-01', '2024-08-15', '2024-08-31'].map((d, i) =>
  cell(d, i === 0)
)
const open: (date: string) => boolean = () => false
const none: (date: string) => boolean = () => false

describe('roving tab targets', () => {
  it('prefers selection, then today, then first in-month, then first rendered', () => {
    expect(computePreferredTarget(days, open, (d) => d === '2024-08-15', '2024-08-01')).toBe(
      '2024-08-15'
    )
    expect(computePreferredTarget(days, open, none, '2024-08-01')).toBe('2024-08-01')
    expect(computePreferredTarget(days, open, none, null)).toBe('2024-08-01')
    expect(
      computePreferredTarget(days, (d) => d !== '2024-07-28', none, null)
    ).toBe('2024-07-28')
  })

  it('returns null when nothing is in bounds', () => {
    expect(computePreferredTarget(days, () => true, none, '2024-08-01')).toBeNull()
  })

  it('relocates a lost target forward-first', () => {
    const blocked = new Set(['2024-08-15'])
    const isDisabled = (d: string) => blocked.has(d)
    // Origin itself blocked: forward-first from the origin index.
    expect(nearestFocusableTarget(days, '2024-08-15', isDisabled)).toBe('2024-08-31')
    expect(nearestFocusableTarget(days, '2024-08-31', isDisabled)).toBe('2024-08-01')
    expect(nearestFocusableTarget(days, null, isDisabled)).toBe('2024-07-28')
    expect(nearestFocusableTarget(days, '2024-08-15', () => true)).toBeNull()
  })
})
