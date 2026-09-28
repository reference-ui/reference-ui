// @vitest-environment happy-dom
import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { hydrateRoot, type Root } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import { Calendar, type CalendarProps } from './index'

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true

// Adapted from quarantine b19c73bee matrix unit suite. Skipped by triage:
// CA-ISO-06/07 (fail-closed render-''), CA-MODE-04 (discriminated props),
// CA-ENV-01 today marker (new paint). CA-DAY-13 landed below; CA-DAY-14 is
// a CT proof (react:all via `pnpm agentct Calendar --react all`).
describe('Calendar contract', () => {
  it('CA-ENV-02: Calendar should register dates and emit navigation, selection, and announcements once across supported React versions and StrictMode replay', () => {
    // Announcements and the today marker do not exist on this branch; the
    // portable core — dates register, mount emits no callbacks — is asserted.
    const onChange = vi.fn()
    const onMonthChange = vi.fn()
    const html = renderToString(
      <React.StrictMode>
        <Calendar
          month="2024-04"
          locale="en-GB"
          today="2024-04-10"
          value="2024-04-10"
          onChange={onChange}
          onMonthChange={onMonthChange}
        />
      </React.StrictMode>
    )
    expect(html).toContain('data-reference-calendar')
    expect(html).toContain('data-date="2024-04-10"')
    expect(onChange).not.toHaveBeenCalled()
    expect(onMonthChange).not.toHaveBeenCalled()
  })

  it('CA-STATE-11 (adapted): explicit today seeds the default pane; controlled month wins', () => {
    // Folded default header presents Month/Year drill-down buttons, so the
    // pane is read from their labels (FEATURES #10).
    const html = renderToString(
      <Calendar locale="en-US" today="2024-02-15" value={null} />
    )
    expect(html).toContain('aria-label="February"')
    expect(html).toContain('>2024</button>')

    const controlled = renderToString(
      <Calendar locale="en-US" month="2024-04" today="2024-02-15" value={null} />
    )
    expect(controlled).toContain('aria-label="April"')
    expect(controlled).not.toContain('aria-label="February"')
  })

  it('CA-ENV-01 (adapted): fully explicit grid SSR is byte-deterministic', () => {
    const render = () =>
      renderToString(
        <Calendar
          month="2024-02"
          locale="en-GB"
          today="2024-02-15"
          value="2024-02-15"
          min="2024-02-01"
          max="2024-02-29"
        />
      )
    const a = render()
    expect(render()).toBe(a)
    expect(a).toContain('data-date="2024-02-15"')
    expect(a).toContain('data-selected=""')
  })

  it('CA-STATE-03 (adapted): deterministic initial tab target — selected, else today, else first in-month day', () => {
    // Disabled-skipping preference pinned separately below (FEATURES #6);
    // here every in-month day is enabled and exactly one carries tabindex=0.
    const tabTargets = (html: string) => html.match(/<button[^>]*tabindex="0"[^>]*>/g) ?? []
    const renderGrid = (props: CalendarProps) =>
      renderToString(<Calendar month="2024-02" {...props} />)

    const selected = renderGrid({ locale: 'en-US', today: '2024-02-15', value: '2024-02-20' })
    const selectedTargets = tabTargets(selected)
    expect(selectedTargets).toHaveLength(1)
    expect(selectedTargets[0]).toContain('data-date="2024-02-20"')

    const noSelection = renderGrid({ locale: 'en-US', today: '2024-02-15', value: null })
    const noSelectionTargets = tabTargets(noSelection)
    expect(noSelectionTargets).toHaveLength(1)
    expect(noSelectionTargets[0]).toContain('data-date="2024-02-15"')

    const todayElsewhere = renderGrid({ locale: 'en-US', today: '2024-03-10', value: null })
    const elsewhereTargets = tabTargets(todayElsewhere)
    expect(elsewhereTargets).toHaveLength(1)
    expect(elsewhereTargets[0]).toContain('data-date="2024-02-01"')
  })

  it('CA-STATE-10 (adapted): explicit null is the controlled empty state; omitted value fails closed', () => {
    const empty = renderToString(
      <Calendar month="2024-06" locale="en-US" today="2024-06-10" value={null} />
    )
    expect(empty).toContain('data-reference-calendar')
    expect(empty).not.toContain('data-selected=""')
    expect(empty.match(/aria-selected="true"/g) ?? []).toHaveLength(0)

    const errors: unknown[][] = []
    const origError = console.error
    console.error = (...args: unknown[]) => {
      errors.push(args)
    }
    try {
      const omittedProps = {
        month: '2024-06',
        locale: 'en-US',
        today: '2024-06-10',
      } as unknown as CalendarProps
      const omitted = renderToString(<Calendar {...omittedProps} />)
      expect(omitted).toBe('')
    } finally {
      console.error = origError
    }
    expect(errors).toHaveLength(1)
    expect(String(errors[0][0])).toContain('value')
    expect(String(errors[0][0])).toContain('required')
  })

  it('CA-MODE-04 (adapted): one discriminant — each mode pairs its exact value shape; month/year seed the pane', () => {
    const monthMode = renderToString(
      <Calendar mode="month" locale="en-US" value="2024-06" />
    )
    expect(monthMode).toContain('aria-label="June"')
    expect(monthMode).toContain('>2024</button>')
    const yearMode = renderToString(
      <Calendar mode="year" locale="en-US" value="2024" />
    )
    expect(yearMode).toContain('aria-label="January"')
    expect(yearMode).toContain('>2024</button>')
    const rangeMode = renderToString(
      <Calendar mode="range" month="2024-06" locale="en-US" value={{ start: '2024-06-10', end: '2024-06-12' }} />
    )
    expect(rangeMode).toContain('data-date="2024-06-10"')
  })

  it('CA-MONTH-01 (adapted): controlled month stays independent of value', () => {
    const renderApril = (value: string | null) =>
      renderToString(<Calendar month="2024-04" locale="en-US" today="2024-04-05" value={value} />)
    const distant = renderApril('2024-09-18')
    expect(distant).toContain('aria-label="April"')
    expect(distant).not.toContain('aria-label="September"')
    expect(renderApril('2024-04-10')).toContain('aria-label="April"')
    expect(renderApril(null)).toContain('aria-label="April"')
  })

  it('CA-MONTH-10 (adapted): fresh mount seeds the omitted month from value', () => {
    const html = renderToString(
      <Calendar locale="en-US" today="2024-02-01" value="2024-09-18" />
    )
    expect(html).toContain('aria-label="September"')
  })

  it('CA-MONTH-04 (adapted): nav disables at the 0001/9999 domain bounds (min/max half pinned below)', () => {
    const jan0001 = renderToString(
      <Calendar month="0001-01" locale="en-US" value={null} />
    )
    expect(jan0001).toContain('January')
    expect(jan0001).not.toContain('1901')
    expect(jan0001).toContain('data-date="0001-01-01"')
    expect(jan0001).toMatch(/aria-label="Previous month"[^>]*disabled/)
    expect(jan0001).not.toMatch(/aria-label="Next month"[^>]*disabled/)
    const dec9999 = renderToString(
      <Calendar month="9999-12" locale="en-US" value={null} />
    )
    expect(dec9999).toMatch(/aria-label="Next month"[^>]*disabled/)
    expect(dec9999).not.toMatch(/aria-label="Previous month"[^>]*disabled/)
    const ordinary = renderToString(
      <Calendar month="2024-06" locale="en-US" value={null} />
    )
    expect(ordinary).not.toContain('disabled')
  })

  it('FEATURES #14: whole-calendar disabled is removed — the prop no longer disables anything', () => {
    const html = renderToString(
      <Calendar month="2024-06" locale="en-US" value={null} {...({ disabled: true } as { disabled?: boolean })} />
    )
    expect(html).toContain('data-reference-calendar')
    expect(html).not.toContain('data-disabled')
    // Every nav + day button stays enabled.
    const buttons = html.match(/<button[^>]*>/g) ?? []
    expect(buttons.length).toBeGreaterThan(0)
    for (const button of buttons) {
      expect(button).not.toContain('disabled')
    }
  })
})

describe('Calendar fail-closed (CA-ISO-06 / CA-ISO-07)', () => {
  const renderInvalid = (props: CalendarProps) => {
    const errors: unknown[][] = []
    const origError = console.error
    console.error = (...args: unknown[]) => {
      errors.push(args)
    }
    try {
      const html = renderToString(<Calendar {...props} />)
      return { html, errors }
    } finally {
      console.error = origError
    }
  }

  const invalidProps: Array<[string, CalendarProps, string]> = [
    ['value', { locale: 'en-US', value: 'not-a-date' } as unknown as CalendarProps, 'not-a-date'],
    ['range start', { locale: 'en-US', mode: 'range', value: { start: '2024-13-40', end: null } } as unknown as CalendarProps, '2024-13-40'],
    ['range end', { locale: 'en-US', mode: 'range', value: { start: '2024-06-10', end: 'June 12' } } as unknown as CalendarProps, 'June 12'],
    ['month', { locale: 'en-US', month: 'not-a-month', value: null } as unknown as CalendarProps, 'not-a-month'],
    ['today', { locale: 'en-US', today: 'tomorrow', value: null } as unknown as CalendarProps, 'tomorrow'],
    ['min', { locale: 'en-US', min: '2024-06-40', value: null } as unknown as CalendarProps, '2024-06-40'],
    ['max', { locale: 'en-US', max: '24-06-10', value: null } as unknown as CalendarProps, '24-06-10'],
  ]

  it.each(invalidProps)(
    'CA-ISO-06: invalid %s renders null with one diagnostic naming prop and bad string',
    (_prop, props, bad) => {
      const onChange = vi.fn()
      const onMonthChange = vi.fn()
      const { html, errors } = renderInvalid({ ...props, onChange, onMonthChange } as unknown as CalendarProps)
      expect(html).toBe('')
      expect(errors).toHaveLength(1)
      expect(String(errors[0][0])).toContain(bad)
      expect(onChange).not.toHaveBeenCalled()
      expect(onMonthChange).not.toHaveBeenCalled()
    }
  )

  const contradictions: Array<[string, CalendarProps, string]> = [
    ['min > max', { locale: 'en-US', min: '2024-06-02', max: '2024-06-01', value: null } as unknown as CalendarProps, 'min'],
    ['day mode with range', { locale: 'en-US', value: { start: '2024-06-10', end: null } } as unknown as CalendarProps, 'value'],
    ['range mode with scalar', { locale: 'en-US', mode: 'range', value: '2024-06-10' } as unknown as CalendarProps, 'value'],
    ['month mode with day', { locale: 'en-US', mode: 'month', value: '2024-06-10' } as unknown as CalendarProps, 'value'],
    ['year mode with month', { locale: 'en-US', mode: 'year', value: '2024-06' } as unknown as CalendarProps, 'value'],
  ]

  it.each(contradictions)(
    'CA-ISO-07: %s renders null with one contradiction diagnostic and no callbacks',
    (_label, props, prop) => {
      const onChange = vi.fn()
      const onMonthChange = vi.fn()
      const { html, errors } = renderInvalid({ ...props, onChange, onMonthChange } as unknown as CalendarProps)
      expect(html).toBe('')
      expect(errors).toHaveLength(1)
      expect(String(errors[0][0])).toContain(prop)
      expect(onChange).not.toHaveBeenCalled()
      expect(onMonthChange).not.toHaveBeenCalled()
    }
  )
})

describe('Calendar FEATURES cluster B', () => {
  const dayButton = (html: string, date: string) => {
    const match = html.match(new RegExp(`<button[^>]*data-date="${date}"[^>]*>`))
    expect(match, `expected a day button for ${date}`).not.toBeNull()
    return match![0]
  }

  const renderInvalidLocale = (props: Record<string, unknown>) => {
    const errors: unknown[][] = []
    const origError = console.error
    console.error = (...args: unknown[]) => {
      errors.push(args)
    }
    try {
      const html = renderToString(<Calendar {...(props as unknown as CalendarProps)} />)
      return { html, errors }
    } finally {
      console.error = origError
    }
  }

  it('FEATURES #3: omitted locale fails closed with one required-locale diagnostic', () => {
    const onChange = vi.fn()
    const onMonthChange = vi.fn()
    const { html, errors } = renderInvalidLocale({ value: null, onChange, onMonthChange })
    expect(html).toBe('')
    expect(errors).toHaveLength(1)
    expect(String(errors[0][0])).toContain('locale')
    expect(String(errors[0][0])).toContain('required')
    expect(onChange).not.toHaveBeenCalled()
    expect(onMonthChange).not.toHaveBeenCalled()
  })

  it('FEATURES #3: structurally invalid locale fails closed naming the bad string', () => {
    const { html, errors } = renderInvalidLocale({ locale: 'not a locale!!', value: null })
    expect(html).toBe('')
    expect(errors).toHaveLength(1)
    expect(String(errors[0][0])).toContain('not a locale!!')
  })

  it('FEATURES #3: explicit non-Gregorian calendar fails closed with no mixed output', () => {
    const isDateUnavailable = vi.fn()
    const { html, errors } = renderInvalidLocale({
      locale: 'ar-SA-u-ca-islamic',
      value: null,
      isDateUnavailable,
    })
    expect(html).toBe('')
    expect(errors).toHaveLength(1)
    expect(String(errors[0][0])).toContain('non-Gregorian')
    expect(isDateUnavailable).not.toHaveBeenCalled()
  })

  it('CA-LOC-04 (adapted): en-GB headers run Monday-first with short text and full names', () => {
    const html = renderToString(
      <Calendar locale="en-GB" month="2024-08" value={null} />
    )
    const headers = [...html.matchAll(/<th[^>]*>([^<]*)<\/th>/g)].map((m) => m[1])
    expect(headers).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
    expect(html).toContain('scope="col"')
    expect(html).toContain('aria-label="Monday"')
    expect(html).toContain('aria-label="Sunday"')
  })

  it('FEATURES #3: firstDayOfWeek overrides the locale CLDR week start', () => {
    const html = renderToString(
      <Calendar locale="en-US" firstDayOfWeek="mon" month="2024-08" value={null} />
    )
    const headers = [...html.matchAll(/<th[^>]*>([^<]*)<\/th>/g)].map((m) => m[1])
    expect(headers[0]).toBe('Mon')
    // August 2024 Monday-first: leading Mon(29)–Wed(31), no Sunday padding.
    expect(html).toContain('data-date="2024-07-29"')
    expect(html).not.toContain('data-date="2024-07-28"')
  })

  it('CA-GRID-05 (adapted): padded days carry data-outside-month; in-month days do not', () => {
    const html = renderToString(
      <Calendar locale="en-GB" month="2024-09" value={null} />
    )
    // September 2024 Monday-first: Aug 26–31 lead, Oct 1–6 trail.
    expect(dayButton(html, '2024-08-26')).toContain('data-outside-month')
    expect(dayButton(html, '2024-10-06')).toContain('data-outside-month')
    expect(dayButton(html, '2024-09-01')).not.toContain('data-outside-month')
    expect(dayButton(html, '2024-09-30')).not.toContain('data-outside-month')
    expect(html.match(/data-outside-month/g) ?? []).toHaveLength(12)
  })

  it('CA-GRID-06 (adapted): visible day numbers pair with full locale accessible names', () => {
    const html = renderToString(
      <Calendar locale="en-GB" month="2024-04" value={null} />
    )
    // Padded May 1 shows "1" but names its full date; in-month April 10 same shape.
    const may1 = html.match(new RegExp(`<button[^>]*data-date="2024-05-01"[^>]*>([^<]*)</button>`))
    expect(may1?.[1]).toBe('1')
    expect(dayButton(html, '2024-05-01')).toContain('May')
    expect(dayButton(html, '2024-05-01')).toContain('2024')
    expect(dayButton(html, '2024-04-10')).toContain('April')
  })

  it('CA-GRID-07 (adapted): day ids are deterministic per instance and unique across instances', () => {
    const render = () =>
      renderToString(
        <div>
          <Calendar locale="en-US" month="2024-04" value={null} />
          <Calendar locale="en-US" month="2024-04" value={null} />
        </div>
      )
    const a = render()
    expect(render()).toBe(a)
    const ids = [...a.matchAll(/id="([^"]*-2024-04-10)"/g)].map((m) => m[1])
    expect(ids).toHaveLength(2)
    expect(ids[0]).not.toBe(ids[1])
  })

  it('CA-STATE-04 (adapted): bounds disable natively; unavailable stays enabled with aria-disabled (W-21)', () => {
    const html = renderToString(
      <Calendar
        locale="en-US"
        month="2024-06"
        value={null}
        min="2024-06-05"
        max="2024-06-25"
        isDateUnavailable={(d) => d === '2024-06-12'}
      />
    )
    for (const outOfBounds of ['2024-06-04', '2024-06-26']) {
      const button = dayButton(html, outOfBounds)
      expect(button).toMatch(/(?:^|\s)disabled(?:=|\s|>)/)
      expect(button).toContain('aria-disabled="true"')
      expect(button).toContain('data-disabled')
      expect(button).not.toContain('data-unavailable')
    }
    const unavailable = dayButton(html, '2024-06-12')
    expect(unavailable).not.toMatch(/(?:^|\s)disabled(?:=|\s|>)/)
    expect(unavailable).toContain('aria-disabled="true"')
    expect(unavailable).toContain('data-unavailable')
    expect(unavailable).not.toContain('data-disabled')
    for (const allowed of ['2024-06-05', '2024-06-10', '2024-06-25']) {
      const button = dayButton(html, allowed)
      expect(button).not.toContain('disabled')
      expect(button).not.toContain('data-disabled')
      expect(button).not.toContain('data-unavailable')
    }
  })

  it('CA-STATE-06 (adapted): a selected date that becomes unavailable keeps paint and tab stop; out-of-bounds loses the tab stop (W-21)', () => {
    const html = renderToString(
      <Calendar
        locale="en-US"
        month="2024-06"
        value="2024-06-12"
        today="2024-06-01"
        isDateUnavailable={(d) => d === '2024-06-12'}
      />
    )
    const button = dayButton(html, '2024-06-12')
    expect(button).toContain('data-selected')
    expect(button).toContain('aria-selected="true"')
    expect(button).toContain('data-unavailable')
    expect(button).toContain('tabindex="0"')
    const targets = html.match(/<button[^>]*tabindex="0"[^>]*>/g) ?? []
    expect(targets).toHaveLength(1)
    expect(targets[0]).toContain('data-date="2024-06-12"')

    const bounded = renderToString(
      <Calendar
        locale="en-US"
        month="2024-06"
        value="2024-06-12"
        today="2024-06-01"
        min="2024-06-13"
      />
    )
    const boundedButton = dayButton(bounded, '2024-06-12')
    expect(boundedButton).toContain('data-selected')
    expect(boundedButton).toContain('data-disabled')
    expect(boundedButton).toContain('tabindex="-1"')
    const boundedTargets = bounded.match(/<button[^>]*tabindex="0"[^>]*>/g) ?? []
    expect(boundedTargets).toHaveLength(1)
    expect(boundedTargets[0]).toContain('data-date="2024-06-13"')
  })

  it('CA-STATE-03 (disabled): the tab target skips out-of-bounds days but lands on unavailable days (W-21)', () => {
    const bounded = renderToString(
      <Calendar locale="en-US" month="2024-06" value={null} today="2024-07-15" min="2024-06-07" />
    )
    const boundedTargets = bounded.match(/<button[^>]*tabindex="0"[^>]*>/g) ?? []
    expect(boundedTargets).toHaveLength(1)
    expect(boundedTargets[0]).toContain('data-date="2024-06-07"')

    const html = renderToString(
      <Calendar
        locale="en-US"
        month="2024-06"
        value={null}
        today="2024-07-15"
        min="2024-06-05"
        isDateUnavailable={(d) => d === '2024-06-05' || d === '2024-06-06'}
      />
    )
    const targets = html.match(/<button[^>]*tabindex="0"[^>]*>/g) ?? []
    expect(targets).toHaveLength(1)
    expect(targets[0]).toContain('data-date="2024-06-05"')
  })

  it('CA-STATE-07 (adapted): an all-out-of-bounds grid exposes no day tab stop', () => {
    const html = renderToString(
      <Calendar locale="en-US" month="2024-04" value={null} min="2024-05-15" max="2024-05-15" />
    )
    expect(html.match(/<button[^>]*tabindex="0"[^>]*>/g) ?? []).toHaveLength(0)
    expect(dayButton(html, '2024-04-10')).toContain('data-disabled')
  })

  it('FEATURES #3: firstDayOfWeek="sun" overrides the en-GB Monday default', () => {
    const html = renderToString(
      <Calendar locale="en-GB" firstDayOfWeek="sun" month="2024-08" value={null} />
    )
    const headers = [...html.matchAll(/<th[^>]*>([^<]*)<\/th>/g)].map((m) => m[1])
    expect(headers[0]).toBe('Sun')
    // August 2024 Sunday-first: leading Sun(28)–Wed(31).
    expect(html).toContain('data-date="2024-07-28"')
  })

  it('W-20: Day replaces cell content with (date, state); null keeps the default number', () => {
    const seen: Array<{ date: string; state: unknown }> = []
    const html = renderToString(
      <Calendar
        locale="en-US"
        month="2024-06"
        mode="range"
        value={{ start: '2024-06-10', end: '2024-06-12' }}
        today="2024-06-11"
        min="2024-06-05"
        isDateUnavailable={(d) => d === '2024-06-12'}
        Day={(date, state) => {
          seen.push({ date, state: { ...state } })
          if (date === '2024-06-15') return null
          return (
            <i data-day-state={`${state.selected ? 1 : 0}${state.inRange ? 1 : 0}${state.disabled ? 1 : 0}${state.today ? 1 : 0}`}>
              {date.slice(8)}
            </i>
          )
        }}
      />
    )
    // Range start endpoint: selected, not in-range, in bounds, not today.
    expect(html).toContain('data-day-state="1000"')
    // Range interior + today marker.
    expect(html).toContain('data-day-state="0101"')
    // Range end endpoint refused by the predicate: selected + disabled.
    expect(html).toContain('data-day-state="1010"')
    // Out-of-bounds day: disabled only.
    expect(html).toContain('data-day-state="0010"')
    // Explicit null keeps the default locale number.
    const plain = html.match(
      new RegExp(`<button[^>]*data-date="2024-06-15"[^>]*>([^<]*)</button>`)
    )
    expect(plain?.[1]).toBe('15')
    // The renderer saw every rendered day button exactly once.
    const dates = seen.map((s) => s.date)
    expect(new Set(dates).size).toBe(dates.length)
    expect(dates).toContain('2024-06-01')
    expect(dates).toContain('2024-06-30')
  })

  it('W-20: a non-function Day fails closed naming the prop', () => {
    const { html, errors } = renderInvalidLocale({
      locale: 'en-US',
      month: '2024-06',
      value: null,
      Day: 'not-a-renderer',
    })
    expect(html).toBe('')
    expect(errors).toHaveLength(1)
    expect(String(errors[0][0])).toContain('Day')
  })

  it('CA-STATE-05 (adapted): the current predicate sees only valid canonical dates, deterministically', () => {
    const seenA: string[] = []
    const seenB: string[] = []
    const render = (seen: string[]) =>
      renderToString(
        <Calendar
          locale="en-US"
          month="2024-09"
          value={null}
          isDateUnavailable={(d) => {
            seen.push(d)
            return false
          }}
        />
      )
    render(seenA)
    render(seenB)
    expect(seenA).toEqual(seenB)
    expect(seenA.length).toBeGreaterThan(0)
    for (const arg of seenA) {
      expect(arg).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
    // The committed rendered set is evaluated: every grid date was asked.
    expect(seenA).toContain('2024-09-01')
    expect(seenA).toContain('2024-09-30')
  })

  it('CA-MONTH-04 (min/max): nav disables exactly when its target month holds no enabled date', () => {
    const bounded = renderToString(
      <Calendar locale="en-US" month="2024-06" value={null} min="2024-06-10" max="2024-06-20" />
    )
    expect(bounded).toMatch(/aria-label="Previous month"[^>]*disabled/)
    expect(bounded).toMatch(/aria-label="Next month"[^>]*disabled/)

    const partial = renderToString(
      <Calendar locale="en-US" month="2024-06" value={null} min="2024-06-10" max="2024-07-05" />
    )
    expect(partial).toMatch(/aria-label="Previous month"[^>]*disabled/)
    expect(partial).not.toMatch(/aria-label="Next month"[^>]*disabled/)
    expect(partial).toContain('aria-label="July 2024"')
  })

  it('CA-STATE-01/08 (adapted): exactly the today cell carries data-today + aria-current', () => {
    const html = renderToString(
      <Calendar locale="en-US" month="2024-02" value="2024-02-20" today="2024-02-15" />
    )
    expect(html.match(/data-today/g) ?? []).toHaveLength(1)
    expect(html.match(/aria-current="date"/g) ?? []).toHaveLength(1)
    expect(dayButton(html, '2024-02-15')).toContain('data-today')
    expect(dayButton(html, '2024-02-20')).not.toContain('data-today')
  })

  it('CA-STATE-11 (adapted): omitted today renders no marker server-side', () => {
    const html = renderToString(
      <Calendar locale="en-US" month="2024-02" value={null} />
    )
    expect(html).not.toContain('data-today')
    expect(html).not.toContain('aria-current')
  })

  it('CA-GRID-09/12 (adapted): Heading is the live atomic div naming the grid unless overridden', () => {
    const html = renderToString(
      <Calendar locale="en-GB" month="2024-01" value={null} />
    )
    const heading = html.match(/<div[^>]*data-reference-calendar-heading=""[^>]*>/)
    expect(heading, 'expected a div Heading').not.toBeNull()
    expect(heading![0]).toContain('aria-live="polite"')
    expect(heading![0]).toContain('aria-atomic="true"')
    const headingId = heading![0].match(/id="([^"]+)"/)?.[1]
    expect(headingId).toBeTruthy()
    expect(html).toContain(`aria-labelledby="${headingId}"`)
    expect(html).toContain('January 2024')

    const overridden = renderToString(
      <Calendar locale="en-GB" month="2024-01" value={null}>
        <Calendar.Header>
          <Calendar.PrevButton />
          <Calendar.Heading />
          <Calendar.NextButton />
        </Calendar.Header>
        <Calendar.Grid aria-label="Billing date" />
      </Calendar>
    )
    expect(overridden).toContain('aria-label="Billing date"')
    expect(overridden).not.toContain('aria-labelledby')
  })

  it('CA-LOC-05 (adapted): nav buttons name their target months; callbacks stay ISO', () => {
    const html = renderToString(
      <Calendar locale="en-GB" month="2024-01" value={null} />
    )
    expect(html).toContain('aria-label="December 2023"')
    expect(html).toContain('aria-label="February 2024"')
    expect(html).not.toContain('aria-label="Previous month"')
    expect(html).not.toContain('aria-label="Next month"')
  })

  it('FEATURES #11: disabled nav keeps the generic name at the domain bounds', () => {
    const html = renderToString(
      <Calendar locale="en-GB" month="0001-01" value={null} />
    )
    expect(html).toMatch(/aria-label="Previous month"[^>]*disabled/)
    expect(html).toContain('aria-label="February 1"')
  })
})

describe('Calendar month/year views (FEATURES #10)', () => {
  const monthCell = (html: string, month: string) => {
    const match = html.match(new RegExp(`<button[^>]*data-month="${month}"[^>]*>`))
    expect(match, `expected a month cell for ${month}`).not.toBeNull()
    return match![0]
  }
  const yearCell = (html: string, year: string) => {
    const match = html.match(new RegExp(`<button[^>]*data-year="${year}"[^>]*>`))
    expect(match, `expected a year cell for ${year}`).not.toBeNull()
    return match![0]
  }

  it('CA-VIEW-01/CA-MODE-01 (adapted): folded day Calendar homes to the day view with Month/Year drill-down', () => {
    const html = renderToString(
      <Calendar locale="en-US" month="2024-04" value={null} />
    )
    expect(html).toContain('data-mode="day"')
    expect(html).toContain('data-view="day"')
    // Default Header: Previous, Heading(Month, Year), Next; drill-downs unpressed.
    expect(html).toContain('data-reference-calendar-month=""')
    expect(html).toContain('data-reference-calendar-year=""')
    expect(html).toContain('aria-pressed="false"')
    expect(html).toContain('aria-label="April"')
    // Day Grid shown; Months and Years rendered hidden (one collection shown).
    expect(html).toContain('data-reference-calendar-grid=""')
    expect(html).toMatch(/data-reference-calendar-months=""[^>]*style="[^"]*display:\s*none/)
    expect(html).toMatch(/data-reference-calendar-years=""[^>]*style="[^"]*display:\s*none/)
    // Exactly one tab stop across all collections: the day grid target.
    const targets = html.match(/<button[^>]*tabindex="0"[^>]*>/g) ?? []
    expect(targets).toHaveLength(1)
    expect(targets[0]).toContain('data-date=')
  })

  it('CA-VIEW-04 (adapted): Months renders twelve locale cells with whole-month min/max disabling', () => {
    const html = renderToString(
      <Calendar
        locale="en-GB"
        month="2024-04"
        value={null}
        min="2024-03-15"
        max="2024-10-02"
      />
    )
    expect(html.match(/data-reference-calendar-month-cell=""/g) ?? []).toHaveLength(12)
    // Short locale names January–December.
    expect(monthCell(html, '2024-01')).toBeTruthy()
    expect(html).toContain('>Dec</button>')
    // Partial months stay enabled; whole months outside stay disabled.
    expect(monthCell(html, '2024-03')).not.toContain('disabled')
    expect(monthCell(html, '2024-10')).not.toContain('disabled')
    for (const whole of ['2024-01', '2024-02', '2024-11', '2024-12']) {
      const cell = monthCell(html, whole)
      expect(cell).toContain('disabled')
      expect(cell).toContain('aria-disabled="true"')
      expect(cell).toContain('data-disabled')
    }
    expect(monthCell(html, '2024-04')).toContain('data-current')
  })

  it('CA-VIEW-06 (adapted): Years lists a clamped 21-year window, or min-through-max years when bounded', () => {
    const html = renderToString(
      <Calendar locale="en-US" month="2024-04" value={null} />
    )
    const cells = html.match(/data-reference-calendar-year-cell=""/g) ?? []
    expect(cells).toHaveLength(21)
    expect(html).toContain('data-year="2014"')
    expect(html).toContain('data-year="2034"')
    expect(yearCell(html, '2024')).toContain('data-current')

    const edgeLow = renderToString(
      <Calendar locale="en-US" month="0001-01" value={null} />
    )
    expect(edgeLow).toContain('data-year="0001"')
    expect(edgeLow).toContain('data-year="0021"')
    expect(edgeLow).not.toContain('data-year="0000"')

    const bounded = renderToString(
      <Calendar
        locale="en-US"
        month="2024-04"
        value={null}
        min="1990-06-01"
        max="1995-01-31"
      />
    )
    expect(bounded.match(/data-reference-calendar-year-cell=""/g) ?? []).toHaveLength(6)
    expect(bounded).toContain('data-year="1990"')
    expect(bounded).toContain('data-year="1995"')
    expect(bounded).not.toContain('data-year="2024"')
  })

  it('CA-VIEW-11 (adapted): a bare Heading names the shown collection — month + year in day view, the year in month view', () => {
    const dayHeading = renderToString(
      <Calendar locale="en-GB" month="2024-04" value={null}>
        <Calendar.Header>
          <Calendar.PrevButton />
          <Calendar.Heading />
          <Calendar.NextButton />
        </Calendar.Header>
        <Calendar.Grid />
        <Calendar.Months />
        <Calendar.Years />
      </Calendar>
    )
    expect(dayHeading).toContain('>April 2024</div>')

    // Month mode homes to the month view, so the bare Heading shows the year.
    const monthHeading = renderToString(
      <Calendar locale="en-GB" mode="month" month="2024-04" value={null}>
        <Calendar.Header>
          <Calendar.PrevButton />
          <Calendar.Heading />
          <Calendar.NextButton />
        </Calendar.Header>
        <Calendar.Months />
        <Calendar.Years />
      </Calendar>
    )
    expect(monthHeading).toContain('>2024</div>')
    expect(monthHeading).not.toContain('>April 2024</div>')
  })

  it('CA-MODE-02 (adapted): folded month mode homes to the month collection with no day grid', () => {
    const html = renderToString(
      <Calendar mode="month" locale="en-US" month="2024-04" value={null} />
    )
    expect(html).toContain('data-mode="month"')
    expect(html).toContain('data-view="month"')
    expect(html).not.toContain('data-reference-calendar-grid=""')
    expect(html).toContain('data-reference-calendar-months=""')
    expect(html).not.toMatch(/data-reference-calendar-months=""[^>]*display:\s*none/)
    // Month cells are the tab scope: exactly one tab stop, on current April.
    const targets = html.match(/<button[^>]*tabindex="0"[^>]*>/g) ?? []
    expect(targets).toHaveLength(1)
    expect(targets[0]).toContain('data-month="2024-04"')
  })

  it('CA-MODE-03 (adapted): folded year mode homes to the year collection with no day or month grid', () => {
    const html = renderToString(
      <Calendar mode="year" locale="en-US" month="2024-04" value={null} />
    )
    expect(html).toContain('data-mode="year"')
    expect(html).toContain('data-view="year"')
    expect(html).not.toContain('data-reference-calendar-grid=""')
    expect(html).not.toContain('data-reference-calendar-months=""')
    expect(html).toContain('data-reference-calendar-years=""')
    const targets = html.match(/<button[^>]*tabindex="0"[^>]*>/g) ?? []
    expect(targets).toHaveLength(1)
    expect(targets[0]).toContain('data-year="2024"')
  })

  it('CA-MODE-05 (adapted): isDateUnavailable blocks a month or year only when every day of the unit is unavailable', () => {
    const weekends = renderToString(
      <Calendar
        mode="month"
        locale="en-US"
        month="2024-04"
        value={null}
        isDateUnavailable={(d) => {
          const day = new Date(`${d}T00:00:00Z`).getUTCDay()
          return day === 0 || day === 6
        }}
      />
    )
    expect(monthCell(weekends, '2024-06')).not.toContain('disabled')

    const wholeJune = renderToString(
      <Calendar
        mode="month"
        locale="en-US"
        month="2024-04"
        value={null}
        isDateUnavailable={(d) => d >= '2024-06-01' && d <= '2024-06-30'}
      />
    )
    const june = monthCell(wholeJune, '2024-06')
    expect(june).toContain('disabled')
    expect(june).toContain('data-disabled')
    expect(monthCell(wholeJune, '2024-07')).not.toContain('disabled')

    const wholeYear = renderToString(
      <Calendar
        mode="year"
        locale="en-US"
        month="2024-04"
        value={null}
        isDateUnavailable={(d) => d >= '2025-01-01' && d <= '2025-12-31'}
      />
    )
    expect(yearCell(wholeYear, '2025')).toContain('disabled')
    expect(yearCell(wholeYear, '2024')).not.toContain('disabled')
  })

  it('CA-DAY-13: custom Days hydrate with deterministic content, managed state, and native identity', async () => {
    const events: Record<string, number> = { '2024-04-08': 2, '2024-04-12': 1 }
    const dayRef = React.createRef<HTMLButtonElement>()
    const onChange = vi.fn()
    const onMonthChange = vi.fn()
    const tree = () => (
      <Calendar
        month="2024-04"
        locale="en-GB"
        today="2024-04-10"
        value="2024-04-10"
        onChange={onChange}
        onMonthChange={onMonthChange}
        isDateUnavailable={(d) => d === '2024-04-12'}
      >
        <Calendar.Grid>
          <Calendar.Days>
            {(day) => (
              <Calendar.Day
                date={day.date}
                ref={day.date === '2024-04-10' ? dayRef : undefined}
              >
                {day.formattedDay}
                {events[day.date] ? (
                  <span aria-hidden="true">{'●'.repeat(events[day.date])}</span>
                ) : null}
              </Calendar.Day>
            )}
          </Calendar.Days>
        </Calendar.Grid>
      </Calendar>
    )

    // Deterministic SSR: byte-equivalent custom content across renders.
    const ssr = renderToString(tree())
    expect(renderToString(tree())).toBe(ssr)
    expect(ssr).toContain('data-date="2024-04-10"')
    expect(ssr).toContain('data-selected=""')
    expect(ssr).toContain('●●')

    // Hydration attaches to the server nodes: no warning, no callback.
    const errors: unknown[][] = []
    const origError = console.error
    console.error = (...args: unknown[]) => {
      errors.push(args)
    }
    const container = document.createElement('div')
    document.body.appendChild(container)
    container.innerHTML = ssr
    try {
      let root: Root | null = null
      await React.act(async () => {
        root = hydrateRoot(container, tree())
      })
      expect(errors).toEqual([])
      expect(onChange).not.toHaveBeenCalled()
      expect(onMonthChange).not.toHaveBeenCalled()
      const serverButton = container.querySelector('button[data-date="2024-04-10"]')
      expect(serverButton).not.toBeNull()
      expect(dayRef.current).toBe(serverButton)
      expect(serverButton!.getAttribute('aria-selected')).toBe('true')
      expect(serverButton!.getAttribute('aria-label')).toContain('April')
      expect(serverButton!.getAttribute('tabindex')).toBe('0')
      expect(serverButton!.textContent).toBe('10')
      expect(
        container.querySelector('button[data-date="2024-04-08"]')!.textContent
      ).toContain('●●')
      await React.act(async () => {
        root!.unmount()
      })
    } finally {
      console.error = origError
      container.remove()
    }
  })
})
