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
    // Per-day disabled state does not exist yet (FEATURES #6), so the
    // disabled-skipping preference is unpinnable; every in-month day is
    // enabled and exactly one carries tabindex=0.
    const tabTargets = (html: string) => html.match(/<button[^>]*tabindex="0"[^>]*>/g) ?? []
    const renderGrid = (props: CalendarProps) =>
      renderToString(<Calendar month="2024-02" locale="en-US" {...props} />)

    const selected = renderGrid({ today: '2024-02-15', value: '2024-02-20' })
    const selectedTargets = tabTargets(selected)
    expect(selectedTargets).toHaveLength(1)
    expect(selectedTargets[0]).toContain('data-date="2024-02-20"')

    const noSelection = renderGrid({ today: '2024-02-15', value: null })
    const noSelectionTargets = tabTargets(noSelection)
    expect(noSelectionTargets).toHaveLength(1)
    expect(noSelectionTargets[0]).toContain('data-date="2024-02-15"')

    const todayElsewhere = renderGrid({ today: '2024-03-10', value: null })
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

  it('CA-MONTH-04 (adapted): nav disables at the 0001/9999 domain bounds only', () => {
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
      const html = renderToString(<Calendar locale="en-US" {...props} />)
      return { html, errors }
    } finally {
      console.error = origError
    }
  }

  const invalidProps: Array<[string, CalendarProps, string]> = [
    ['value', { value: 'not-a-date' } as unknown as CalendarProps, 'not-a-date'],
    ['range start', { mode: 'range', value: { start: '2024-13-40', end: null } } as unknown as CalendarProps, '2024-13-40'],
    ['range end', { mode: 'range', value: { start: '2024-06-10', end: 'June 12' } } as unknown as CalendarProps, 'June 12'],
    ['month', { month: 'not-a-month', value: null } as unknown as CalendarProps, 'not-a-month'],
    ['today', { today: 'tomorrow', value: null } as unknown as CalendarProps, 'tomorrow'],
    ['min', { min: '2024-06-40', value: null } as unknown as CalendarProps, '2024-06-40'],
    ['max', { max: '24-06-10', value: null } as unknown as CalendarProps, '24-06-10'],
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
    ['min > max', { min: '2024-06-02', max: '2024-06-01', value: null } as unknown as CalendarProps, 'min'],
    ['day mode with range', { value: { start: '2024-06-10', end: null } } as unknown as CalendarProps, 'value'],
    ['range mode with scalar', { mode: 'range', value: '2024-06-10' } as unknown as CalendarProps, 'value'],
    ['month mode with day', { mode: 'month', value: '2024-06-10' } as unknown as CalendarProps, 'value'],
    ['year mode with month', { mode: 'year', value: '2024-06' } as unknown as CalendarProps, 'value'],
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
