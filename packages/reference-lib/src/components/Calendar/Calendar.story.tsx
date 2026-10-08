import * as React from 'react'
import { createPortal } from 'react-dom'
import { Div, Span, Button } from '@reference-ui/react'
import { ReferenceLibrary } from '../ReferenceLibrary'
import {
  Calendar,
  type CalendarDayState,
  type DateRangeValue,
  type ISOMonth,
  type ISOYear,
} from './index'

type DayStatesWindow = Window & {
  __dayStates?: Record<string, CalendarDayState>
  __dayRef?: HTMLButtonElement | null
  __refLog?: string[]
  __unavailCalls?: string[]
  __strictRef?: HTMLButtonElement | null
}

/** Record every render state on window for CT state assertions. */
function recordDayState(day: CalendarDayState) {
  const w = window as DayStatesWindow
  w.__dayStates ??= {}
  w.__dayStates[day.date] = { ...day }
}

export const SingleDate = () => {
  const [date, setDate] = React.useState<string | null>('2026-08-15')
  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" display="flex" flexDirection="column" gap="3r" data-testid="calendar-fixture-root">
        <Calendar
          locale="en-US"
          data-testid="test-calendar"
          month="2026-08"
          value={date}
          onChange={setDate}
        >
          <Calendar.Header>
            <Calendar.PrevButton data-testid="calendar-prev" />
            <Calendar.Heading data-testid="calendar-heading" />
            <Calendar.NextButton data-testid="calendar-next" />
          </Calendar.Header>
          <Calendar.Grid data-testid="calendar-grid" />
        </Calendar>
        <Span fontSize="3r" color="design.text.light" data-testid="calendar-value-display">
          Selected Date: {date ?? 'None'}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const DateRange = () => {
  const [range, setRange] = React.useState<DateRangeValue>({
    start: '2026-08-10',
    end: '2026-08-20',
  })
  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" display="flex" flexDirection="column" gap="3r" data-testid="range-fixture-root">
        <Calendar
          locale="en-US"
          data-testid="test-range-calendar"
          mode="range"
          month="2026-08"
          value={range}
          onChange={setRange}
        >
          <Calendar.Header>
            <Calendar.PrevButton />
            <Calendar.Heading />
            <Calendar.NextButton />
          </Calendar.Header>
          <Calendar.Grid />
        </Calendar>
        <Span fontSize="3r" color="design.text.light" data-testid="range-value-display">
          Range: {range.start ?? '...'} to {range.end ?? '...'}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const LeapFebruary = () => {
  const [date, setDate] = React.useState<string | null>('2024-02-15')
  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" display="flex" flexDirection="column" gap="3r" data-testid="leap-fixture-root">
        <Calendar
          locale="en-US"
          data-testid="test-leap-calendar"
          month="2024-02"
          value={date}
          onChange={setDate}
        >
          <Calendar.Header>
            <Calendar.PrevButton />
            <Calendar.Heading data-testid="leap-heading" />
            <Calendar.NextButton />
          </Calendar.Header>
          <Calendar.Grid data-testid="leap-grid" />
        </Calendar>
      </Div>
    </ReferenceLibrary>
  )
}

export const NoSelectionTodayElsewhere = () => {
  const [date, setDate] = React.useState<string | null>(null)
  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" display="flex" flexDirection="column" gap="3r" data-testid="elsewhere-fixture-root">
        <Calendar
          locale="en-US"
          data-testid="test-elsewhere-calendar"
          month="2024-02"
          today="2024-03-10"
          value={date}
          onChange={setDate}
        >
          <Calendar.Header>
            <Calendar.PrevButton data-testid="elsewhere-prev" />
            <Calendar.Heading data-testid="elsewhere-heading" />
            <Calendar.NextButton data-testid="elsewhere-next" />
          </Calendar.Header>
          <Calendar.Grid data-testid="elsewhere-grid" />
        </Calendar>
      </Div>
    </ReferenceLibrary>
  )
}

export const EmissionCounter = () => {
  const [date, setDate] = React.useState<string | null>(null)
  const [emissions, setEmissions] = React.useState<string[]>([])
  const [accept, setAccept] = React.useState(true)
  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" display="flex" flexDirection="column" gap="3r" data-testid="emit-fixture-root">
        <Calendar
          locale="en-US"
          data-testid="test-emit-calendar"
          month="2024-04"
          value={date}
          onChange={(next) => {
            setEmissions((prev) => [...prev, next])
            if (accept) setDate(next)
          }}
        >
          <Calendar.Header>
            <Calendar.PrevButton />
            <Calendar.Heading data-testid="emit-heading" />
            <Calendar.NextButton />
          </Calendar.Header>
          <Calendar.Grid data-testid="emit-grid" />
        </Calendar>
        <Span fontSize="3r" color="design.text.light" data-testid="emit-log">
          {emissions.join(',') || 'none'}
        </Span>
        <Button
          type="button"
          data-testid="emit-toggle-accept"
          onClick={() => setAccept((a) => !a)}
        >
          {accept ? 'reject' : 'accept'}
        </Button>
      </Div>
    </ReferenceLibrary>
  )
}

export const MonthMachine = () => {
  const [month, setMonth] = React.useState<ISOMonth>('2024-01')
  const [requests, setRequests] = React.useState<ISOMonth[]>([])
  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" display="flex" flexDirection="column" gap="3r" data-testid="month-fixture-root">
        <Calendar
          locale="en-US"
          data-testid="test-month-calendar"
          month={month}
          onMonthChange={(next) => setRequests((prev) => [...prev, next])}
          value={null}
          today="2024-01-15"
        >
          <Calendar.Header>
            <Calendar.PrevButton data-testid="month-prev" />
            <Calendar.Heading data-testid="month-heading" />
            <Calendar.Month data-testid="month-drill" />
            <Calendar.Year data-testid="month-year-drill" />
            <Calendar.NextButton data-testid="month-next" />
          </Calendar.Header>
          <Calendar.Grid data-testid="month-grid" />
          <Calendar.Months data-testid="month-months" />
          <Calendar.Years data-testid="month-years" />
        </Calendar>
        <Span fontSize="3r" color="design.text.light" data-testid="month-requests">
          {requests.join(',') || 'none'}
        </Span>
        <Div display="flex" gap="2r">
          <Button
            type="button"
            data-testid="month-accept"
            onClick={() =>
              setRequests((prev) => {
                const last = prev[prev.length - 1]
                if (last) setMonth(last)
                return []
              })
            }
          >
            Accept
          </Button>
          <Button type="button" data-testid="month-min" onClick={() => { setMonth('0001-01'); setRequests([]) }}>
            Min
          </Button>
          <Button type="button" data-testid="month-max" onClick={() => { setMonth('9999-12'); setRequests([]) }}>
            Max
          </Button>
          <Button type="button" data-testid="month-reset" onClick={() => { setMonth('2024-01'); setRequests([]) }}>
            Reset
          </Button>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const UncontrolledMonth = () => {
  const [value, setValue] = React.useState<string | null>('2024-09-18')
  const [mounted, setMounted] = React.useState(true)
  const [hidden, setHidden] = React.useState(false)
  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" display="flex" flexDirection="column" gap="3r" data-testid="unc-fixture-root">
        {mounted && (
          <Div style={{ display: hidden ? 'none' : undefined }}>
            <Calendar
              locale="en-US"
              data-testid="test-unc-calendar"
              value={value}
              onChange={setValue}
              today="2024-09-01"
            >
              <Calendar.Header>
                <Calendar.PrevButton data-testid="unc-prev" />
                <Calendar.Heading data-testid="unc-heading" />
                <Calendar.NextButton data-testid="unc-next" />
              </Calendar.Header>
              <Calendar.Grid data-testid="unc-grid" />
            </Calendar>
          </Div>
        )}
        <Span fontSize="3r" color="design.text.light" data-testid="unc-value">
          {value ?? 'None'}
        </Span>
        <Div display="flex" gap="2r">
          <Button type="button" data-testid="unc-set-april" onClick={() => setValue('2024-04-10')}>
            April value
          </Button>
          <Button type="button" data-testid="unc-unmount" onClick={() => setMounted(false)}>
            Unmount
          </Button>
          <Button type="button" data-testid="unc-remount" onClick={() => setMounted(true)}>
            Remount
          </Button>
          <Button type="button" data-testid="unc-hide" onClick={() => setHidden(true)}>
            Hide
          </Button>
          <Button type="button" data-testid="unc-show" onClick={() => setHidden(false)}>
            Show
          </Button>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const DecemberNav = () => {
  const [date, setDate] = React.useState<string | null>(null)
  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" display="flex" flexDirection="column" gap="3r" data-testid="dec-fixture-root">
        <Calendar
          locale="en-US"
          data-testid="test-dec-calendar"
          today="2026-12-15"
          value={date}
          onChange={setDate}
        >
          <Calendar.Header>
            <Calendar.PrevButton data-testid="dec-prev" />
            <Calendar.Heading data-testid="dec-heading" />
            <Calendar.NextButton data-testid="dec-next" />
          </Calendar.Header>
          <Calendar.Grid data-testid="dec-grid" />
        </Calendar>
      </Div>
    </ReferenceLibrary>
  )
}

export const BritishGrid = () => {
  const [locale, setLocale] = React.useState('en-GB')
  const [date, setDate] = React.useState<string | null>('2024-09-18')
  const [changes, setChanges] = React.useState<string[]>([])
  const [monthReqs, setMonthReqs] = React.useState<ISOMonth[]>([])
  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" display="flex" flexDirection="column" gap="3r" data-testid="gb-fixture-root">
        <Calendar
          locale={locale}
          data-testid="test-gb-calendar"
          month="2024-09"
          today="2024-09-10"
          value={date}
          onChange={(next) => {
            setChanges((prev) => [...prev, next])
            setDate(next)
          }}
          onMonthChange={(next) => setMonthReqs((prev) => [...prev, next])}
        >
          <Calendar.Header>
            <Calendar.PrevButton data-testid="gb-prev" />
            <Calendar.Heading data-testid="gb-heading" />
            <Calendar.NextButton data-testid="gb-next" />
          </Calendar.Header>
          <Calendar.Grid data-testid="gb-grid" />
        </Calendar>
        <Span fontSize="3r" color="design.text.light" data-testid="gb-value">
          {date ?? 'None'}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="gb-changes">
          {changes.join(',') || 'none'}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="gb-month-reqs">
          {monthReqs.join(',') || 'none'}
        </Span>
        <Button
          type="button"
          data-testid="gb-toggle-locale"
          onClick={() => setLocale((l) => (l === 'en-GB' ? 'en-US' : 'en-GB'))}
        >
          {locale}
        </Button>
      </Div>
    </ReferenceLibrary>
  )
}

export const Constrained = () => {
  const [date, setDate] = React.useState<string | null>(null)
  const [changes, setChanges] = React.useState<string[]>([])
  const [monthReqs, setMonthReqs] = React.useState<ISOMonth[]>([])
  const [blockTen, setBlockTen] = React.useState(false)
  const [blockAll, setBlockAll] = React.useState(false)
  const [bounded, setBounded] = React.useState(false)
  const isDateUnavailable = React.useCallback(
    (d: string) => {
      if (blockAll) return true
      if (d >= '2024-04-11' && d <= '2024-04-13') return true
      if (blockTen && d === '2024-04-10') return true
      return false
    },
    [blockAll, blockTen]
  )
  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" display="flex" flexDirection="column" gap="3r" data-testid="con-fixture-root">
        <Calendar
          locale="en-US"
          data-testid="test-con-calendar"
          month="2024-04"
          today="2024-05-01"
          min={bounded ? '2024-04-15' : '2024-04-05'}
          max="2024-04-20"
          isDateUnavailable={isDateUnavailable}
          value={date}
          onChange={(next) => {
            setChanges((prev) => [...prev, next])
            setDate(next)
          }}
          onMonthChange={(next) => setMonthReqs((prev) => [...prev, next])}
        >
          <Calendar.Header>
            <Calendar.PrevButton data-testid="con-prev" />
            <Calendar.Heading data-testid="con-heading" />
            <Calendar.NextButton data-testid="con-next" />
          </Calendar.Header>
          <Calendar.Grid data-testid="con-grid" />
        </Calendar>
        <Span fontSize="3r" color="design.text.light" data-testid="con-value">
          {date ?? 'None'}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="con-changes">
          {changes.join(',') || 'none'}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="con-month-reqs">
          {monthReqs.join(',') || 'none'}
        </Span>
        <Div display="flex" gap="2r">
          <Button type="button" data-testid="con-toggle-ten" onClick={() => setBlockTen((b) => !b)}>
            {blockTen ? 'unblock-10' : 'block-10'}
          </Button>
          <Button type="button" data-testid="con-toggle-all" onClick={() => setBlockAll((b) => !b)}>
            {blockAll ? 'unblock-all' : 'block-all'}
          </Button>
          <Button type="button" data-testid="con-toggle-bounds" onClick={() => setBounded((b) => !b)}>
            {bounded ? 'unbind' : 'bind'}
          </Button>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const OutsideMonth = () => {
  const [month, setMonth] = React.useState<ISOMonth>('2024-09')
  const [monthReqs, setMonthReqs] = React.useState<ISOMonth[]>([])
  const [date, setDate] = React.useState<string | null>(null)
  const [changes, setChanges] = React.useState<string[]>([])
  const [events, setEvents] = React.useState<string[]>([])
  const [bounded, setBounded] = React.useState(false)
  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" display="flex" flexDirection="column" gap="3r" data-testid="out-fixture-root">
        <Calendar
          locale="en-US"
          data-testid="test-out-calendar"
          month={month}
          today="2024-09-15"
          min={bounded ? '2024-09-10' : undefined}
          max={bounded ? '2024-09-20' : undefined}
          value={date}
          onChange={(next) => {
            setChanges((prev) => [...prev, next])
            setEvents((prev) => [...prev, `c:${next}`])
            setDate(next)
          }}
          onMonthChange={(next) => {
            setMonthReqs((prev) => [...prev, next])
            setEvents((prev) => [...prev, `m:${next}`])
          }}
        >
          <Calendar.Header>
            <Calendar.PrevButton data-testid="out-prev" />
            <Calendar.Heading data-testid="out-heading" />
            <Calendar.NextButton data-testid="out-next" />
          </Calendar.Header>
          <Calendar.Grid data-testid="out-grid" />
        </Calendar>
        <Span fontSize="3r" color="design.text.light" data-testid="out-month-reqs">
          {monthReqs.join(',') || 'none'}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="out-changes">
          {changes.join(',') || 'none'}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="out-events">
          {events.join(',') || 'none'}
        </Span>
        <Div display="flex" gap="2r">
          <Button
            type="button"
            data-testid="out-accept"
            onClick={() =>
              setMonthReqs((prev) => {
                const last = prev[prev.length - 1]
                if (last) setMonth(last)
                return []
              })
            }
          >
            Accept
          </Button>
          <Button type="button" data-testid="out-reject" onClick={() => setMonthReqs([])}>
            Reject
          </Button>
          <Button type="button" data-testid="out-toggle-bounds" onClick={() => setBounded((b) => !b)}>
            {bounded ? 'unbind' : 'bind'}
          </Button>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const UncontrolledToday = () => {
  const [date, setDate] = React.useState<string | null>(null)
  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" display="flex" flexDirection="column" gap="3r" data-testid="omt-fixture-root">
        <Calendar
          locale="en-US"
          data-testid="test-omt-calendar"
          value={date}
          onChange={setDate}
        >
          <Calendar.Header>
            <Calendar.PrevButton data-testid="omt-prev" />
            <Calendar.Heading data-testid="omt-heading" />
            <Calendar.NextButton data-testid="omt-next" />
          </Calendar.Header>
          <Calendar.Grid data-testid="omt-grid" />
        </Calendar>
      </Div>
    </ReferenceLibrary>
  )
}

export const RtlGrid = () => {
  const [date, setDate] = React.useState<string | null>(null)
  const [changes, setChanges] = React.useState<string[]>([])
  const [monthReqs, setMonthReqs] = React.useState<ISOMonth[]>([])
  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" display="flex" flexDirection="column" gap="3r" data-testid="rtl-fixture-root" dir="rtl">
        <Calendar
          locale="ar-AE"
          data-testid="test-rtl-calendar"
          month="2024-01"
          today="2024-01-15"
          value={date}
          onChange={(next) => {
            setChanges((prev) => [...prev, next])
            setDate(next)
          }}
          onMonthChange={(next) => setMonthReqs((prev) => [...prev, next])}
        >
          <Calendar.Header>
            <Calendar.PrevButton data-testid="rtl-prev" />
            <Calendar.Heading data-testid="rtl-heading" />
            <Calendar.Month data-testid="rtl-month" />
            <Calendar.Year data-testid="rtl-year" />
            <Calendar.NextButton data-testid="rtl-next" />
          </Calendar.Header>
          <Calendar.Grid data-testid="rtl-grid" />
          <Calendar.Months data-testid="rtl-months" />
          <Calendar.Years data-testid="rtl-years" />
        </Calendar>
        <Span fontSize="3r" color="design.text.light" data-testid="rtl-changes">
          {changes.join(',') || 'none'}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="rtl-month-reqs">
          {monthReqs.join(',') || 'none'}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const FoldedViews = () => {
  const [date, setDate] = React.useState<string | null>('2024-04-10')
  const [changes, setChanges] = React.useState<string[]>([])
  const [monthReqs, setMonthReqs] = React.useState<ISOMonth[]>([])
  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" display="flex" flexDirection="column" gap="3r" data-testid="views-fixture-root">
        <Calendar
          locale="en-GB"
          data-testid="test-views-calendar"
          month="2024-04"
          value={date}
          onChange={(next) => {
            setChanges((prev) => [...prev, next])
            setDate(next)
          }}
          onMonthChange={(next) => setMonthReqs((prev) => [...prev, next])}
          min="2024-03-15"
          max="2024-10-02"
        />
        <Span fontSize="3r" color="design.text.light" data-testid="views-value">
          {date ?? 'None'}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="views-changes">
          {changes.join(',') || 'none'}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="views-month-reqs">
          {monthReqs.join(',') || 'none'}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const ControlledViews = () => {
  const [month, setMonth] = React.useState<ISOMonth>('2024-04')
  const [monthReqs, setMonthReqs] = React.useState<ISOMonth[]>([])
  const [date, setDate] = React.useState<string | null>('2024-04-10')
  const [changes, setChanges] = React.useState<string[]>([])
  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" display="flex" flexDirection="column" gap="3r" data-testid="cviews-fixture-root">
        <Calendar
          locale="en-US"
          data-testid="test-cviews-calendar"
          month={month}
          today="2024-04-15"
          value={date}
          onChange={(next) => {
            setChanges((prev) => [...prev, next])
            setDate(next)
          }}
          onMonthChange={(next) => setMonthReqs((prev) => [...prev, next])}
        />
        <Span fontSize="3r" color="design.text.light" data-testid="cviews-value">
          {date ?? 'None'}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="cviews-changes">
          {changes.join(',') || 'none'}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="cviews-month-reqs">
          {monthReqs.join(',') || 'none'}
        </Span>
        <Div display="flex" gap="2r">
          <Button
            type="button"
            data-testid="cviews-accept"
            onClick={() =>
              setMonthReqs((prev) => {
                const last = prev[prev.length - 1]
                if (last) setMonth(last)
                return []
              })
            }
          >
            Accept
          </Button>
          <Button type="button" data-testid="cviews-reject" onClick={() => setMonthReqs([])}>
            Reject
          </Button>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const MonthMode = () => {
  const [value, setValue] = React.useState<ISOMonth | null>(null)
  const [changes, setChanges] = React.useState<string[]>([])
  const [pane, setPane] = React.useState<ISOMonth>('2024-04')
  const [monthReqs, setMonthReqs] = React.useState<ISOMonth[]>([])
  const [blockJune, setBlockJune] = React.useState(false)
  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" display="flex" flexDirection="column" gap="3r" data-testid="mmonth-fixture-root">
        <Calendar
          locale="en-US"
          data-testid="test-mmonth-calendar"
          mode="month"
          month={pane}
          value={value}
          onChange={(next) => {
            setChanges((prev) => [...prev, next])
            setValue(next)
          }}
          onMonthChange={(next) => setMonthReqs((prev) => [...prev, next])}
          isDateUnavailable={blockJune ? (d) => d >= '2024-06-01' && d <= '2024-06-30' : undefined}
        />
        <Span fontSize="3r" color="design.text.light" data-testid="mmonth-value">
          {value ?? 'None'}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="mmonth-changes">
          {changes.join(',') || 'none'}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="mmonth-month-reqs">
          {monthReqs.join(',') || 'none'}
        </Span>
        <Div display="flex" gap="2r">
          <Button
            type="button"
            data-testid="mmonth-accept"
            onClick={() =>
              setMonthReqs((prev) => {
                const last = prev[prev.length - 1]
                if (last) setPane(last)
                return []
              })
            }
          >
            Accept
          </Button>
          <Button type="button" data-testid="mmonth-block-june" onClick={() => setBlockJune((b) => !b)}>
            {blockJune ? 'unblock-june' : 'block-june'}
          </Button>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const YearMode = () => {
  const [value, setValue] = React.useState<ISOYear | null>(null)
  const [changes, setChanges] = React.useState<string[]>([])
  const [blockYear, setBlockYear] = React.useState(false)
  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" display="flex" flexDirection="column" gap="3r" data-testid="ymode-fixture-root">
        <Calendar
          locale="en-US"
          data-testid="test-ymode-calendar"
          mode="year"
          month="2024-04"
          value={value}
          onChange={(next) => {
            setChanges((prev) => [...prev, next])
            setValue(next)
          }}
          isDateUnavailable={blockYear ? (d) => d >= '2025-01-01' && d <= '2025-12-31' : undefined}
        />
        <Span fontSize="3r" color="design.text.light" data-testid="ymode-value">
          {value ?? 'None'}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="ymode-changes">
          {changes.join(',') || 'none'}
        </Span>
        <Div display="flex" gap="2r">
          <Button type="button" data-testid="ymode-block-2025" onClick={() => setBlockYear((b) => !b)}>
            {blockYear ? 'unblock-2025' : 'block-2025'}
          </Button>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const RangeViews = () => {
  const [range, setRange] = React.useState<DateRangeValue>({
    start: '2024-03-20',
    end: '2024-06-02',
  })
  const [changes, setChanges] = React.useState<string[]>([])
  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" display="flex" flexDirection="column" gap="3r" data-testid="rviews-fixture-root">
        <Calendar
          locale="en-US"
          data-testid="test-rviews-calendar"
          mode="range"
          month="2024-04"
          value={range}
          onChange={(next) => {
            setChanges((prev) => [...prev, `${next.start}:${next.end}`])
            setRange(next)
          }}
        />
        <Span fontSize="3r" color="design.text.light" data-testid="rviews-changes">
          {changes.join(',') || 'none'}
        </Span>
        <Div display="flex" gap="2r">
          <Button
            type="button"
            data-testid="rviews-3yr"
            onClick={() => setRange({ start: '2023-05-01', end: '2025-08-01' })}
          >
            3yr range
          </Button>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const BareHeadingViews = () => {
  const [veto, setVeto] = React.useState(false)
  const [month, setMonth] = React.useState<ISOMonth>('2024-04')
  const [monthReqs, setMonthReqs] = React.useState<ISOMonth[]>([])
  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" display="flex" flexDirection="column" gap="3r" data-testid="bare-fixture-root">
        <Calendar
          locale="en-US"
          data-testid="test-bare-calendar"
          month={month}
          value={null}
          onMonthChange={(next) => setMonthReqs((prev) => [...prev, next])}
        >
          <Calendar.Header>
            <Calendar.PrevButton data-testid="bare-prev" />
            <Calendar.Heading data-testid="bare-heading" />
            <Calendar.Month
              data-testid="bare-month"
              onClick={veto ? (e) => e.preventDefault() : undefined}
            />
            <Calendar.Year data-testid="bare-year" />
            <Calendar.NextButton data-testid="bare-next" />
          </Calendar.Header>
          <Calendar.Grid data-testid="bare-grid" />
          <Calendar.Months data-testid="bare-months" />
          <Calendar.Years data-testid="bare-years" />
        </Calendar>
        <Span fontSize="3r" color="design.text.light" data-testid="bare-month-reqs">
          {monthReqs.join(',') || 'none'}
        </Span>
        <Div display="flex" gap="2r">
          <Button
            type="button"
            data-testid="bare-accept"
            onClick={() =>
              setMonthReqs((prev) => {
                const last = prev[prev.length - 1]
                if (last) setMonth(last)
                return []
              })
            }
          >
            Accept
          </Button>
          <Button type="button" data-testid="bare-veto" onClick={() => setVeto((v) => !v)}>
            {veto ? 'veto-on' : 'veto-off'}
          </Button>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const CustomDayCells = () => {
  const [date, setDate] = React.useState<string | null>(null)
  const [changes, setChanges] = React.useState<string[]>([])
  // Event counts per date: a plain day (04-08), an unavailable day
  // (04-12), and an out-of-bounds day (04-02). 04-15 returns null
  // explicitly; every other date falls through to the default cell.
  const events: Record<string, number> = {
    '2024-04-02': 1,
    '2024-04-08': 2,
    '2024-04-12': 1,
  }
  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" display="flex" flexDirection="column" gap="3r" data-testid="custom-fixture-root">
        <Calendar
          locale="en-US"
          data-testid="test-custom-calendar"
          month="2024-04"
          today="2024-04-10"
          min="2024-04-05"
          max="2024-04-25"
          isDateUnavailable={(d) => d >= '2024-04-11' && d <= '2024-04-13'}
          Day={(day) => {
            const count = events[day]
            if (!count) return null
            return (
              <Span display="inline-flex" flexDirection="column" alignItems="center" lineHeight="1">
                {Number(day.slice(8, 10))}
                <Span data-testid={`day-dot-${day}`} fontSize="2r" aria-hidden="true">
                  {'●'.repeat(count)}
                </Span>
              </Span>
            )
          }}
          value={date}
          onChange={(next) => {
            setChanges((prev) => [...prev, next])
            setDate(next)
          }}
        >
          <Calendar.Header>
            <Calendar.PrevButton data-testid="custom-prev" />
            <Calendar.Heading data-testid="custom-heading" />
            <Calendar.NextButton data-testid="custom-next" />
          </Calendar.Header>
          <Calendar.Grid data-testid="custom-grid" />
        </Calendar>
        <Span fontSize="3r" color="design.text.light" data-testid="custom-value">
          {date ?? 'None'}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="custom-changes">
          {changes.join(',') || 'none'}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const WeekStartOverride = () => {
  const [usDate, setUsDate] = React.useState<string | null>(null)
  const [gbDate, setGbDate] = React.useState<string | null>(null)
  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" display="flex" flexDirection="column" gap="3r" data-testid="ws-fixture-root">
        <Calendar
          locale="en-US"
          firstDayOfWeek="mon"
          data-testid="test-ws-us-calendar"
          month="2024-04"
          today="2024-04-10"
          value={usDate}
          onChange={setUsDate}
        >
          <Calendar.Header>
            <Calendar.PrevButton />
            <Calendar.Heading data-testid="ws-us-heading" />
            <Calendar.NextButton />
          </Calendar.Header>
          <Calendar.Grid data-testid="ws-us-grid" />
        </Calendar>
        <Calendar
          locale="en-GB"
          firstDayOfWeek="sun"
          data-testid="test-ws-gb-calendar"
          month="2024-04"
          today="2024-04-10"
          value={gbDate}
          onChange={setGbDate}
        >
          <Calendar.Header>
            <Calendar.PrevButton />
            <Calendar.Heading data-testid="ws-gb-heading" />
            <Calendar.NextButton />
          </Calendar.Header>
          <Calendar.Grid data-testid="ws-gb-grid" />
        </Calendar>
      </Div>
    </ReferenceLibrary>
  )
}

export const DayPartsDefault = () => {
  const [date, setDate] = React.useState<string | null>('2024-04-10')
  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" display="flex" flexDirection="column" gap="3r" data-testid="ddef-fixture-root">
        <Calendar
          locale="en-GB"
          data-testid="test-ddef-calendar"
          month="2024-04"
          today="2024-04-10"
          value={date}
          onChange={setDate}
        >
          <Calendar.Grid data-testid="ddef-grid">
            <Calendar.Days />
          </Calendar.Grid>
        </Calendar>
        <Span fontSize="3r" color="design.text.light" data-testid="ddef-value">
          {date ?? 'None'}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

type DayCustomVariant = 'plain' | 'decorated' | 'conflict'

export const DayCustom = () => {
  const [date, setDate] = React.useState<string | null>('2024-04-10')
  const [month, setMonth] = React.useState<ISOMonth>('2024-04')
  const [locale, setLocale] = React.useState('en-GB')
  const [variant, setVariant] = React.useState<DayCustomVariant>('decorated')
  const [vetoClick, setVetoClick] = React.useState(false)
  const [vetoKey, setVetoKey] = React.useState(false)
  const [unavailB, setUnavailB] = React.useState(false)
  const [eventsB, setEventsB] = React.useState(false)
  const [log, setLog] = React.useState<string[]>([])
  const [bumps, setBumps] = React.useState(0)
  const events = eventsB
    ? { '2024-04-09': 3, '2024-04-13': 2 }
    : { '2024-04-08': 2, '2024-04-12': 1 }
  // Stable ref: logs sets + null cleanups without render-spam (React 19
  // ref-effect semantics would re-run an inline callback per render).
  const day10Ref = React.useCallback((node: HTMLButtonElement | null) => {
    const w = window as DayStatesWindow
    w.__dayRef = node
    w.__refLog ??= []
    w.__refLog.push(node ? `set:${node.dataset.date}` : 'null')
  }, [])
  const dayLog = (entry: string) => setLog((prev) => [...prev, entry])
  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" display="flex" flexDirection="column" gap="3r" data-testid="dcustom-fixture-root">
        <Calendar
          locale={locale}
          data-testid="test-dcustom-calendar"
          month={month}
          today="2024-04-11"
          min="2024-04-05"
          isDateUnavailable={(d) => (unavailB ? d === '2024-04-13' : d === '2024-04-12')}
          value={date}
          onChange={(next) => {
            dayLog(`change:${next}`)
            setDate(next)
          }}
        >
          <Calendar.Grid data-testid="dcustom-grid">
            <Calendar.Days>
              {(day) => {
                recordDayState(day)
                if (variant === 'plain') {
                  return <Calendar.Day date={day.date}>{day.formattedDay}</Calendar.Day>
                }
                if (variant === 'conflict') {
                  return (
                    <Calendar.Day
                      date={day.date}
                      aria-label="forged label"
                      aria-selected={day.date !== '2024-04-10'}
                      aria-disabled={day.date === '2024-04-10' ? 'true' : 'false'}
                      disabled={day.date === '2024-04-10'}
                      tabIndex={0}
                      data-selected="forged"
                      data-in-range="forged"
                      data-outside-month="forged"
                      data-today="forged"
                      data-disabled="forged"
                      data-unavailable="forged"
                      data-focused="forged"
                      data-range-start="forged"
                      data-range-end="forged"
                      aria-describedby="dcustom-desc"
                    >
                      {day.formattedDay}
                    </Calendar.Day>
                  )
                }
                const count = events[day.date as keyof typeof events] as number | undefined
                return (
                  <Calendar.Day
                    date={day.date}
                    title={`day ${day.date}`}
                    data-booking-count={String(count ?? 0)}
                    className="dcustom-day"
                    style={{ color: 'rgb(255, 0, 0)' }}
                    fontWeight="700"
                    ref={day.date === '2024-04-10' ? day10Ref : undefined}
                    onClick={(e) => {
                      dayLog(`click:${day.date}`)
                      if (vetoClick) e.preventDefault()
                    }}
                    onKeyDown={(e) => {
                      dayLog(`key:${day.date}:${e.key}`)
                      if (vetoKey) e.preventDefault()
                    }}
                  >
                    <Span>{day.formattedDay}</Span>
                    {count ? (
                      <Span data-testid={`dcustom-dot-${day.date}`} fontSize="2r" aria-hidden="true">
                        {'●'.repeat(count)}
                      </Span>
                    ) : null}
                  </Calendar.Day>
                )
              }}
            </Calendar.Days>
          </Calendar.Grid>
        </Calendar>
        <Span fontSize="3r" color="design.text.light" data-testid="dcustom-value">
          {date ?? 'None'}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="dcustom-log">
          {log.join(',') || 'none'}
        </Span>
        <Span fontSize="3r" color="design.text.light" id="dcustom-desc">
          day description
        </Span>
        <Div display="flex" gap="2r" flexWrap="wrap">
          <Button type="button" data-testid="dcustom-plain" onClick={() => setVariant('plain')}>
            plain
          </Button>
          <Button type="button" data-testid="dcustom-decorated" onClick={() => setVariant('decorated')}>
            decorated
          </Button>
          <Button type="button" data-testid="dcustom-conflict" onClick={() => setVariant('conflict')}>
            conflict
          </Button>
          <Button type="button" data-testid="dcustom-veto-click" onClick={() => setVetoClick((v) => !v)}>
            {vetoClick ? 'veto-click-on' : 'veto-click-off'}
          </Button>
          <Button type="button" data-testid="dcustom-veto-key" onClick={() => setVetoKey((v) => !v)}>
            {vetoKey ? 'veto-key-on' : 'veto-key-off'}
          </Button>
          <Button type="button" data-testid="dcustom-locale" onClick={() => setLocale((l) => (l === 'en-GB' ? 'ar-SA' : 'en-GB'))}>
            {locale}
          </Button>
          <Button type="button" data-testid="dcustom-month" onClick={() => setMonth((m) => (m === '2024-04' ? '2024-05' : '2024-04'))}>
            {month}
          </Button>
          <Button type="button" data-testid="dcustom-value-14" onClick={() => setDate('2024-04-14')}>
            value-14
          </Button>
          <Button type="button" data-testid="dcustom-unavail" onClick={() => setUnavailB((b) => !b)}>
            {unavailB ? 'unavail-b' : 'unavail-a'}
          </Button>
          <Button type="button" data-testid="dcustom-events" onClick={() => setEventsB((b) => !b)}>
            {eventsB ? 'events-b' : 'events-a'}
          </Button>
          <Button type="button" data-testid="dcustom-bump" onClick={() => setBumps((b) => b + 1)}>
            bump-{bumps}
          </Button>
          <Button
            type="button"
            data-testid="dcustom-reset"
            onClick={() => {
              setLog([])
              setDate(null)
            }}
          >
            reset
          </Button>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

type ViolationVariant =
  | 'mismatch'
  | 'noncanonical'
  | 'empty'
  | 'multiple'
  | 'native'
  | 'wrapped'
  | 'component'
  | 'valid'

const ForeignDay = ({ date }: { date: string }) => (
  <button type="button" data-foreign-day={date}>
    {date}
  </button>
)

export const DayViolations = () => {
  const [variant, setVariant] = React.useState<ViolationVariant>('mismatch')
  const [date, setDate] = React.useState<string | null>(null)
  const [changes, setChanges] = React.useState<string[]>([])
  const [monthReqs, setMonthReqs] = React.useState<ISOMonth[]>([])
  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" display="flex" flexDirection="column" gap="3r" data-testid="dviol-fixture-root">
        <Calendar
          locale="en-GB"
          data-testid="test-dviol-calendar"
          month="2024-04"
          today="2024-04-10"
          value={date}
          onChange={(next) => {
            setChanges((prev) => [...prev, next])
            setDate(next)
          }}
          onMonthChange={(next) => setMonthReqs((prev) => [...prev, next])}
          isDateUnavailable={(d) => {
            const w = window as DayStatesWindow
            w.__unavailCalls ??= []
            w.__unavailCalls.push(d)
            return d === '2024-04-12'
          }}
        >
          <Calendar.Grid data-testid="dviol-grid">
            <Calendar.Days>
              {(day) => {
                recordDayState(day)
                if (day.date !== '2024-04-10') {
                  return <Calendar.Day date={day.date}>{day.formattedDay}</Calendar.Day>
                }
                switch (variant) {
                  case 'mismatch':
                    return <Calendar.Day date="2024-04-11">10</Calendar.Day>
                  case 'noncanonical':
                    return <Calendar.Day date={'2024-4-1' as unknown as string}>10</Calendar.Day>
                  case 'empty':
                    return null as unknown as React.ReactElement
                  case 'multiple':
                    return (
                      <>
                        <Calendar.Day date="2024-04-10">10a</Calendar.Day>
                        <Calendar.Day date="2024-04-10">10b</Calendar.Day>
                      </>
                    )
                  case 'native':
                    return (
                      <button type="button" data-date="2024-04-10">
                        10
                      </button>
                    )
                  case 'wrapped':
                    return (
                      <span>
                        <Calendar.Day date="2024-04-10">10</Calendar.Day>
                      </span>
                    )
                  case 'component':
                    return <ForeignDay date="2024-04-10" />
                  case 'valid':
                    return <Calendar.Day date="2024-04-10">10</Calendar.Day>
                }
              }}
            </Calendar.Days>
          </Calendar.Grid>
        </Calendar>
        <Span fontSize="3r" color="design.text.light" data-testid="dviol-changes">
          {changes.join(',') || 'none'}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="dviol-month-reqs">
          {monthReqs.join(',') || 'none'}
        </Span>
        <Div display="flex" gap="2r" flexWrap="wrap">
          {(
            [
              'mismatch',
              'noncanonical',
              'empty',
              'multiple',
              'native',
              'wrapped',
              'component',
              'valid',
            ] as ViolationVariant[]
          ).map((v) => (
            <Button key={v} type="button" data-testid={`dviol-${v}`} onClick={() => setVariant(v)}>
              {v}
            </Button>
          ))}
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const ModeSwitch = () => {
  const [mode, setMode] = React.useState<'day' | 'month' | 'year' | 'range'>('day')
  const [changes, setChanges] = React.useState<string[]>([])
  // One instance, dynamic mode prop (null value is legal in every branch);
  // the cast keeps the discriminated union happy — runtime is what's proven.
  const calendarProps = {
    locale: 'en-US',
    'data-testid': 'test-mswitch-calendar',
    ...(mode === 'day' ? {} : { mode }),
    month: '2024-04',
    value: null,
    onChange: (next: unknown) => setChanges((prev) => [...prev, JSON.stringify(next)]),
  } as unknown as React.ComponentProps<typeof Calendar>
  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" display="flex" flexDirection="column" gap="3r" data-testid="mswitch-fixture-root">
        <Calendar {...calendarProps} />
        <Span fontSize="3r" color="design.text.light" data-testid="mswitch-changes">
          {changes.join(',') || 'none'}
        </Span>
        <Div display="flex" gap="2r">
          <Button type="button" data-testid="mswitch-day" onClick={() => setMode('day')}>
            day
          </Button>
          <Button type="button" data-testid="mswitch-month" onClick={() => setMode('month')}>
            month
          </Button>
          <Button type="button" data-testid="mswitch-year" onClick={() => setMode('year')}>
            year
          </Button>
          <Button type="button" data-testid="mswitch-range" onClick={() => setMode('range')}>
            range
          </Button>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

const PENDING_10: DateRangeValue = { start: '2024-04-10', end: null }
const PENDING_15: DateRangeValue = { start: '2024-04-15', end: null }
const COMPLETED_10_13: DateRangeValue = { start: '2024-04-10', end: '2024-04-13' }
const COMPLETED_10_15: DateRangeValue = { start: '2024-04-10', end: '2024-04-15' }

export const RangeMachine = () => {
  const [range, setRange] = React.useState<DateRangeValue | null>(null)
  const [month, setMonth] = React.useState<ISOMonth>('2024-04')
  const [requests, setRequests] = React.useState<string[]>([])
  const [monthReqs, setMonthReqs] = React.useState<ISOMonth[]>([])
  const [order, setOrder] = React.useState<string[]>([])
  const [block12, setBlock12] = React.useState(false)
  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" display="flex" flexDirection="column" gap="3r" data-testid="rmachine-fixture-root">
        <Calendar
          locale="en-GB"
          data-testid="test-rmachine-calendar"
          mode="range"
          month={month}
          today="2024-04-03"
          value={range}
          onChange={(next) => {
            setRequests((prev) => [...prev, JSON.stringify(next)])
            setOrder((prev) => [...prev, `change:${next.start}:${next.end}`])
          }}
          onMonthChange={(next) => {
            setMonthReqs((prev) => [...prev, next])
            setOrder((prev) => [...prev, `month:${next}`])
          }}
          isDateUnavailable={block12 ? (d) => d === '2024-04-12' : undefined}
        >
          <Calendar.Grid data-testid="rmachine-grid">
            <Calendar.Days>
              {(day) => {
                recordDayState(day)
                return <Calendar.Day date={day.date}>{day.formattedDay}</Calendar.Day>
              }}
            </Calendar.Days>
          </Calendar.Grid>
        </Calendar>
        <Span fontSize="3r" color="design.text.light" data-testid="rmachine-value">
          {range ? `${range.start}:${range.end}` : 'none'}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="rmachine-requests">
          {requests.join('|') || 'none'}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="rmachine-month-reqs">
          {monthReqs.join(',') || 'none'}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="rmachine-order">
          {order.join('|') || 'none'}
        </Span>
        <Div display="flex" gap="2r" flexWrap="wrap">
          <Button type="button" data-testid="rmachine-null" onClick={() => setRange(null)}>
            null
          </Button>
          <Button type="button" data-testid="rmachine-pending-10" onClick={() => setRange({ ...PENDING_10 })}>
            pending-10
          </Button>
          <Button type="button" data-testid="rmachine-pending-15" onClick={() => setRange({ ...PENDING_15 })}>
            pending-15
          </Button>
          <Button type="button" data-testid="rmachine-completed" onClick={() => setRange({ ...COMPLETED_10_15 })}>
            completed
          </Button>
          <Button type="button" data-testid="rmachine-completed-13" onClick={() => setRange({ ...COMPLETED_10_13 })}>
            completed-13
          </Button>
          <Button
            type="button"
            data-testid="rmachine-accept"
            onClick={() =>
              setRequests((prev) => {
                const last = prev[prev.length - 1]
                if (last) setRange(JSON.parse(last) as DateRangeValue)
                return prev
              })
            }
          >
            Accept
          </Button>
          <Button type="button" data-testid="rmachine-reject" onClick={() => setRequests((prev) => prev.slice(0, -1))}>
            Reject
          </Button>
          <Button
            type="button"
            data-testid="rmachine-accept-month"
            onClick={() =>
              setMonthReqs((prev) => {
                const last = prev[prev.length - 1]
                if (last) setMonth(last)
                return []
              })
            }
          >
            Accept month
          </Button>
          <Button type="button" data-testid="rmachine-block12" onClick={() => setBlock12((b) => !b)}>
            {block12 ? 'block12-on' : 'block12-off'}
          </Button>
          <Button
            type="button"
            data-testid="rmachine-clear"
            onClick={() => {
              setRequests([])
              setMonthReqs([])
              setOrder([])
            }}
          >
            clear-logs
          </Button>
        </Div>
        <Button type="button" data-testid="range-after">
          after grid
        </Button>
      </Div>
    </ReferenceLibrary>
  )
}

export const RangeBounds = () => {
  const [range, setRange] = React.useState<DateRangeValue | null>({
    start: '2024-09-28',
    end: null,
  })
  const [month, setMonth] = React.useState<ISOMonth>('2024-09')
  const [requests, setRequests] = React.useState<string[]>([])
  const [monthReqs, setMonthReqs] = React.useState<ISOMonth[]>([])
  const [order, setOrder] = React.useState<string[]>([])
  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" display="flex" flexDirection="column" gap="3r" data-testid="rbounds-fixture-root">
        <Calendar
          locale="en-GB"
          data-testid="test-bounds-calendar"
          mode="range"
          month={month}
          today="2024-09-28"
          min="2024-09-05"
          max="2024-10-03"
          value={range}
          onChange={(next) => {
            setRequests((prev) => [...prev, JSON.stringify(next)])
            setOrder((prev) => [...prev, `change:${next.start}:${next.end}`])
          }}
          onMonthChange={(next) => {
            setMonthReqs((prev) => [...prev, next])
            setOrder((prev) => [...prev, `month:${next}`])
          }}
        >
          <Calendar.Grid data-testid="rbounds-grid">
            <Calendar.Days>
              {(day) => {
                recordDayState(day)
                return <Calendar.Day date={day.date}>{day.formattedDay}</Calendar.Day>
              }}
            </Calendar.Days>
          </Calendar.Grid>
        </Calendar>
        <Span fontSize="3r" color="design.text.light" data-testid="rbounds-value">
          {range ? `${range.start}:${range.end}` : 'none'}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="rbounds-requests">
          {requests.join('|') || 'none'}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="rbounds-order">
          {order.join('|') || 'none'}
        </Span>
        <Div display="flex" gap="2r" flexWrap="wrap">
          <Button
            type="button"
            data-testid="rbounds-accept"
            onClick={() =>
              setRequests((prev) => {
                const last = prev[prev.length - 1]
                if (last) setRange(JSON.parse(last) as DateRangeValue)
                return prev
              })
            }
          >
            Accept
          </Button>
          <Button
            type="button"
            data-testid="rbounds-accept-month"
            onClick={() =>
              setMonthReqs((prev) => {
                const last = prev[prev.length - 1]
                if (last) setMonth(last)
                return []
              })
            }
          >
            Accept month
          </Button>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const StrictDays = () => {
  const [date, setDate] = React.useState<string | null>(null)
  const [consumerEvents, setConsumerEvents] = React.useState(0)
  const [changes, setChanges] = React.useState<string[]>([])
  const [bumps, setBumps] = React.useState(0)
  const strictRef = React.useCallback((node: HTMLButtonElement | null) => {
    ;(window as DayStatesWindow).__strictRef = node
  }, [])
  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" display="flex" flexDirection="column" gap="3r" data-testid="strict-fixture-root">
        <React.StrictMode>
          <Calendar
            locale="en-GB"
            data-testid="test-strict-calendar"
            month="2024-04"
            today="2024-04-10"
            value={date}
            onChange={(next) => {
              setChanges((prev) => [...prev, next])
              setDate(next)
            }}
          >
            <Calendar.Grid data-testid="strict-grid">
              <Calendar.Days>
                {(day) => {
                  recordDayState(day)
                  return (
                    <Calendar.Day
                      date={day.date}
                      ref={day.date === '2024-04-10' ? strictRef : undefined}
                      onClick={() => setConsumerEvents((n) => n + 1)}
                    >
                      {day.formattedDay}
                    </Calendar.Day>
                  )
                }}
              </Calendar.Days>
            </Calendar.Grid>
          </Calendar>
        </React.StrictMode>
        <Span fontSize="3r" color="design.text.light" data-testid="strict-consumer">
          {consumerEvents}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="strict-changes">
          {changes.join(',') || 'none'}
        </Span>
        <Button type="button" data-testid="strict-bump" onClick={() => setBumps((b) => b + 1)}>
          bump-{bumps}
        </Button>
      </Div>
    </ReferenceLibrary>
  )
}

export const ShadowRange = () => {
  const hostRef = React.useRef<HTMLDivElement>(null)
  const [shadow, setShadow] = React.useState<ShadowRoot | null>(null)
  const [range, setRange] = React.useState<DateRangeValue | null>({ ...PENDING_10 })
  const [month, setMonth] = React.useState<ISOMonth>('2024-04')
  const [requests, setRequests] = React.useState<string[]>([])
  const [monthReqs, setMonthReqs] = React.useState<ISOMonth[]>([])
  React.useEffect(() => {
    if (hostRef.current && !hostRef.current.shadowRoot) {
      setShadow(hostRef.current.attachShadow({ mode: 'open' }))
    }
  }, [])
  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" display="flex" flexDirection="column" gap="3r" data-testid="shadow-fixture-root">
        <Button type="button" data-testid="shadow-before">
          before grid
        </Button>
        <div ref={hostRef} data-testid="shadow-host" />
        {shadow &&
          createPortal(
            <div>
              <Calendar
                locale="en-GB"
                data-testid="test-shadow-calendar"
                mode="range"
                month={month}
                today="2024-04-03"
                value={range}
                onChange={(next) => {
                  setRequests((prev) => [...prev, JSON.stringify(next)])
                  setRange(next)
                }}
                onMonthChange={(next) => setMonthReqs((prev) => [...prev, next])}
              >
                <Calendar.Grid data-testid="shadow-grid">
                  <Calendar.Days>
                    {(day) => {
                      recordDayState(day)
                      return <Calendar.Day date={day.date}>{day.formattedDay}</Calendar.Day>
                    }}
                  </Calendar.Days>
                </Calendar.Grid>
              </Calendar>
              <button
                type="button"
                data-testid="shadow-accept-month"
                onClick={() =>
                  setMonthReqs((prev) => {
                    const last = prev[prev.length - 1]
                    if (last) setMonth(last)
                    return []
                  })
                }
              >
                Accept month
              </button>
            </div>,
            shadow
          )}
        <Span fontSize="3r" color="design.text.light" data-testid="shadow-value">
          {range ? `${range.start}:${range.end}` : 'none'}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="shadow-requests">
          {requests.join('|') || 'none'}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="shadow-month-reqs">
          {monthReqs.join(',') || 'none'}
        </Span>
        <Button type="button" data-testid="shadow-after">
          after grid
        </Button>
      </Div>
    </ReferenceLibrary>
  )
}

export const View13CustomDays = () => {
  const [date, setDate] = React.useState<string | null>('2024-04-10')
  const [month, setMonth] = React.useState<ISOMonth>('2024-04')
  const [monthReqs, setMonthReqs] = React.useState<ISOMonth[]>([])
  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" display="flex" flexDirection="column" gap="3r" data-testid="v13-fixture-root">
        <Calendar
          locale="en-GB"
          data-testid="test-v13-calendar"
          month={month}
          today="2024-04-10"
          value={date}
          onChange={setDate}
          onMonthChange={(next) => setMonthReqs((prev) => [...prev, next])}
        >
          <Calendar.Grid data-testid="v13-grid">
            <Calendar.Days>
              {(day) => {
                recordDayState(day)
                return (
                  <Calendar.Day date={day.date}>
                    <span data-testid={`v13-custom-${day.date}`}>custom-{day.formattedDay}</span>
                  </Calendar.Day>
                )
              }}
            </Calendar.Days>
          </Calendar.Grid>
        </Calendar>
        <Span fontSize="3r" color="design.text.light" data-testid="v13-value">
          {date ?? 'None'}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="v13-month-reqs">
          {monthReqs.join(',') || 'none'}
        </Span>
        <Button
          type="button"
          data-testid="v13-accept-month"
          onClick={() =>
            setMonthReqs((prev) => {
              const last = prev[prev.length - 1]
              if (last) setMonth(last)
              return []
            })
          }
        >
          Accept month
        </Button>
      </Div>
    </ReferenceLibrary>
  )
}
