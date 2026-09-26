import * as React from 'react'
import { Div, Span, Button } from '@reference-ui/react'
import { ReferenceLibrary } from '../ReferenceLibrary'
import { Calendar, type DateRangeValue, type ISOMonth } from './index'

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
            <Calendar.NextButton data-testid="month-next" />
          </Calendar.Header>
          <Calendar.Grid data-testid="month-grid" />
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
          min="2024-04-05"
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
            <Calendar.NextButton data-testid="rtl-next" />
          </Calendar.Header>
          <Calendar.Grid data-testid="rtl-grid" />
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
