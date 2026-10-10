import { describe, expect, it } from 'vitest'
import { rangeSpanHasBlockedDate } from './span'

describe('rangeSpanHasBlockedDate', () => {
  it('reports false when no date in the span refuses', () => {
    expect(rangeSpanHasBlockedDate('2024-02-27', '2024-03-02', () => false)).toBe(false)
  })

  it('reports true when an interior date refuses', () => {
    expect(rangeSpanHasBlockedDate('2024-02-27', '2024-03-02', (d) => d === '2024-02-29')).toBe(
      true
    )
  })

  it('checks both endpoints inclusively', () => {
    expect(rangeSpanHasBlockedDate('2024-03-01', '2024-03-03', (d) => d === '2024-03-01')).toBe(
      true
    )
    expect(rangeSpanHasBlockedDate('2024-03-01', '2024-03-03', (d) => d === '2024-03-03')).toBe(
      true
    )
  })

  it('fails closed at the Gregorian domain edge', () => {
    expect(rangeSpanHasBlockedDate('9999-12-31', '9999-12-31', () => false)).toBe(false)
    // A span running past the edge throws mid-walk and fails closed.
    expect(rangeSpanHasBlockedDate('9999-12-31', '9999-12-32', () => false)).toBe(true)
  })
})
