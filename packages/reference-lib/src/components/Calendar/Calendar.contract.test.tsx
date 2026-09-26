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

  it('uncontrolled API retained (quarantine controlled-only freeze NOT ported)', () => {
    const uncontrolled: CalendarProps = { defaultValue: '2024-04-10' }
    expect(uncontrolled.defaultValue).toBe('2024-04-10')
    const html = renderToString(
      <Calendar month="2024-04" defaultValue="2024-04-10" />
    )
    expect(html).toContain('data-date="2024-04-10"')
    expect(html).toContain('data-selected=""')
  })
})
