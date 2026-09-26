import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { ReferenceLibrary } from '../ReferenceLibrary'
import { Calendar, type DateRangeValue } from './index'

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
