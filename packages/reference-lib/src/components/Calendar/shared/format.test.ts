import { describe, expect, it } from 'vitest'
import {
  formatLongMonth,
  formatMonthYear,
  formatShortMonth,
  formatYear,
} from './format'

describe('locale collection names', () => {
  it('names the pane month and year', () => {
    expect(formatMonthYear('en-US', 2024, 1)).toBe('February 2024')
    expect(formatYear('en-US', 2024)).toBe('2024')
  })

  it('names short and long months', () => {
    expect(formatShortMonth('en-US', 2024, 5)).toBe('Jun')
    expect(formatLongMonth('en-US', 2024, 5)).toBe('June')
  })

  it('restores years 0–99 past the Date.UTC 19xx mapping', () => {
    expect(formatYear('en-US', 5)).toBe('5')
    expect(formatMonthYear('en-US', 99, 0)).toBe('January 99')
  })

  it('keeps the language under a non-default calendar', () => {
    expect(formatMonthYear('en-US-u-ca-buddhist', 2024, 1)).toBe('February 2024')
  })
})
