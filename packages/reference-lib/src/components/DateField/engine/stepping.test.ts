import { describe, expect, it } from 'vitest'
import { resolveStep } from './stepping'

const allow: (date: string) => boolean = () => true

describe('resolveStep', () => {
  it('steps the segment under the caret with Gregorian carry', () => {
    // en-US order is month/day/year: caret 3 sits in the day segment.
    expect(
      resolveStep({
        text: '8/15/2026',
        base: { valid: true, iso: '2026-08-15' },
        caret: 3,
        locale: 'en-US',
        key: 'ArrowUp',
        shiftKey: false,
        isAllowed: allow,
      })
    ).toEqual({ stepped: '2026-08-16', nextText: '8/16/2026' })
    // Caret 0 sits in the month segment: Jan 31 + 1 month clamps to Feb 29.
    expect(
      resolveStep({
        text: '1/31/2024',
        base: { valid: true, iso: '2024-01-31' },
        caret: 0,
        locale: 'en-US',
        key: 'ArrowUp',
        shiftKey: false,
        isAllowed: allow,
      })
    ).toEqual({ stepped: '2024-02-29', nextText: '2/29/2024' })
  })

  it('steps ±10 with Shift', () => {
    expect(
      resolveStep({
        text: '8/15/2026',
        base: { valid: true, iso: '2026-08-15' },
        caret: 6,
        locale: 'en-US',
        key: 'ArrowDown',
        shiftKey: true,
        isAllowed: allow,
      })
    ).toEqual({ stepped: '2016-08-15', nextText: '8/15/2016' })
  })

  it('returns null without a base, past the domain, or off constraints', () => {
    const valid = { valid: true, iso: '2026-08-15' }
    expect(
      resolveStep({
        text: '',
        base: { valid: false, iso: null },
        caret: 0,
        locale: 'en-US',
        key: 'ArrowUp',
        shiftKey: false,
        isAllowed: allow,
      })
    ).toBeNull()
    expect(
      resolveStep({
        text: '12/31/9999',
        base: { valid: true, iso: '9999-12-31' },
        caret: 3,
        locale: 'en-US',
        key: 'ArrowUp',
        shiftKey: false,
        isAllowed: allow,
      })
    ).toBeNull()
    expect(
      resolveStep({
        text: '8/15/2026',
        base: valid,
        caret: 3,
        locale: 'en-US',
        key: 'ArrowUp',
        shiftKey: false,
        isAllowed: () => false,
      })
    ).toBeNull()
  })
})
