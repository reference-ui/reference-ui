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
