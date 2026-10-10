import { describe, expect, it } from 'vitest'
import type { CalendarProps } from '../types'
import { validateCalendarProps } from './validate'

describe('validateCalendarProps', () => {
  it('accepts a valid fixture in every mode', () => {
    expect(
      validateCalendarProps({ locale: 'en-US', value: '2024-08-15' } as CalendarProps)
    ).toBeNull()
    expect(
      validateCalendarProps({
        locale: 'en-US',
        mode: 'range',
        value: { start: '2024-08-15', end: null },
      } as CalendarProps)
    ).toBeNull()
    expect(
      validateCalendarProps({ locale: 'en-US', mode: 'month', value: '2024-08' } as CalendarProps)
    ).toBeNull()
    expect(
      validateCalendarProps({ locale: 'en-US', mode: 'year', value: '2024' } as CalendarProps)
    ).toBeNull()
  })

  it('rejects an unknown mode and a missing value', () => {
    expect(
      validateCalendarProps({ locale: 'en-US', mode: 'week', value: null } as unknown as CalendarProps)
    ).toMatch(/invalid mode/)
    expect(validateCalendarProps({ locale: 'en-US' } as unknown as CalendarProps)).toMatch(
      /value is required/
    )
  })

  it('rejects mode/value shape mismatches', () => {
    expect(
      validateCalendarProps({ locale: 'en-US', value: '2024-13-40' } as CalendarProps)
    ).toMatch(/invalid value/)
    expect(
      validateCalendarProps({
        locale: 'en-US',
        mode: 'range',
        value: { start: 'nope', end: null },
      } as unknown as CalendarProps)
    ).toMatch(/invalid range start/)
    expect(
      validateCalendarProps({
        locale: 'en-US',
        mode: 'range',
        value: { start: '2024-08-15', end: 'nope' },
      } as unknown as CalendarProps)
    ).toMatch(/invalid range end/)
    expect(
      validateCalendarProps({ locale: 'en-US', mode: 'month', value: '2024' } as unknown as CalendarProps)
    ).toMatch(/invalid value/)
    expect(
      validateCalendarProps({ locale: 'en-US', mode: 'year', value: '24' } as unknown as CalendarProps)
    ).toMatch(/invalid value/)
  })

  it('rejects invalid date-like props and contradictory bounds', () => {
    expect(
      validateCalendarProps({ locale: 'en-US', value: null, month: '2024-13' } as CalendarProps)
    ).toMatch(/invalid month/)
    expect(
      validateCalendarProps({ locale: 'en-US', value: null, today: 'tomorrow' } as CalendarProps)
    ).toMatch(/invalid today/)
    expect(
      validateCalendarProps({ locale: 'en-US', value: null, min: 'x' } as CalendarProps)
    ).toMatch(/invalid min/)
    expect(
      validateCalendarProps({ locale: 'en-US', value: null, max: 'x' } as CalendarProps)
    ).toMatch(/invalid max/)
    expect(
      validateCalendarProps({
        locale: 'en-US',
        value: null,
        min: '2024-08-16',
        max: '2024-08-15',
      } as CalendarProps)
    ).toMatch(/contradictory bounds/)
  })

  it('requires a structurally valid locale and a function Day', () => {
    expect(validateCalendarProps({ value: null } as unknown as CalendarProps)).toMatch(
      /locale is required/
    )
    expect(
      validateCalendarProps({ locale: '!!!', value: null } as unknown as CalendarProps)
    ).toMatch(/invalid locale/)
    expect(
      validateCalendarProps({ locale: 'en-US', value: null, Day: 'x' } as unknown as CalendarProps)
    ).toMatch(/invalid Day/)
  })
})
