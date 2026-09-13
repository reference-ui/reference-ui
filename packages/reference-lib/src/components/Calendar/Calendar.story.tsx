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
