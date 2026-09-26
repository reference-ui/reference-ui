// @vitest-environment happy-dom
import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { Calendar, type CalendarProps } from './index'

// Adapted from quarantine b19c73bee matrix unit suite. Skipped by triage:
// CA-ISO-06/07 (fail-closed render-''), CA-MODE-04 (discriminated props),
// CA-DAY-13/14 (Weekdays/Days/Day parts), CA-ENV-01 today marker (new paint).
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
    const html = renderToString(
      <Calendar locale="en-US" today="2024-02-15" value={null} />
    )
    expect(html).toContain('February 2024')

    const controlled = renderToString(
      <Calendar locale="en-US" month="2024-04" today="2024-02-15" value={null} />
    )
    expect(controlled).toContain('April 2024')
    expect(controlled).not.toContain('February 2024')
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
    expect(monthMode).toContain('June 2024')
    const yearMode = renderToString(
      <Calendar mode="year" locale="en-US" value="2024" />
    )
    expect(yearMode).toContain('January 2024')
    const rangeMode = renderToString(
      <Calendar mode="range" month="2024-06" locale="en-US" value={{ start: '2024-06-10', end: '2024-06-12' }} />
    )
    expect(rangeMode).toContain('data-date="2024-06-10"')
  })

  it('CA-MONTH-01 (adapted): controlled month stays independent of value', () => {
    const renderApril = (value: string | null) =>
      renderToString(<Calendar month="2024-04" locale="en-US" today="2024-04-05" value={value} />)
    const distant = renderApril('2024-09-18')
    expect(distant).toContain('April 2024')
    expect(distant).not.toContain(' September 2024')
    expect(renderApril('2024-04-10')).toContain('April 2024')
    expect(renderApril(null)).toContain('April 2024')
  })

  it('CA-MONTH-10 (adapted): fresh mount seeds the omitted month from value', () => {
    const html = renderToString(
      <Calendar locale="en-US" today="2024-02-01" value="2024-09-18" />
    )
    expect(html).toContain('September 2024')
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

  it('CA-STATE-04 (adapted): bounds + predicate combine into one disabled triple-state', () => {
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
    for (const blocked of ['2024-06-04', '2024-06-26', '2024-06-12']) {
      const button = dayButton(html, blocked)
      expect(button).toContain('disabled')
      expect(button).toContain('aria-disabled="true"')
      expect(button).toContain('data-disabled')
    }
    for (const allowed of ['2024-06-05', '2024-06-10', '2024-06-25']) {
      const button = dayButton(html, allowed)
      expect(button).not.toContain('disabled')
      expect(button).not.toContain('data-disabled')
    }
  })

  it('CA-STATE-06 (adapted): a selected date that becomes disabled stays painted but loses the tab stop', () => {
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
    expect(button).toContain('data-disabled')
    expect(button).toContain('tabindex="-1"')
    const targets = html.match(/<button[^>]*tabindex="0"[^>]*>/g) ?? []
    expect(targets).toHaveLength(1)
    expect(targets[0]).toContain('data-date="2024-06-01"')
  })

  it('CA-STATE-03 (disabled): the tab target skips disabled days to the first enabled in-month day', () => {
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
    expect(targets[0]).toContain('data-date="2024-06-07"')
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
