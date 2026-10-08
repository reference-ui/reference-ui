import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { Calendar, type DateRangeValue } from './index'

export default {
  SingleDate: () => {
    const [date, setDate] = React.useState<string | null>('2026-08-31')
    return (
      <Div maxW="80r" display="flex" flexDirection="column" gap="3r">
        <Calendar locale="en-US" value={date} onChange={setDate}>
          <Calendar.Header>
            <Calendar.PrevButton />
            <Calendar.Heading />
            <Calendar.NextButton />
          </Calendar.Header>
          <Calendar.Grid />
        </Calendar>
        <Span fontSize="3r" color="design.text.light">Selected: {date ?? 'None'}</Span>
      </Div>
    )
  },
  DateRange: () => {
    const [range, setRange] = React.useState<DateRangeValue>({
      start: '2026-08-10',
      end: '2026-08-20',
    })
    return (
      <Div maxW="80r" display="flex" flexDirection="column" gap="3r">
        <Calendar mode="range" locale="en-US" value={range} onChange={setRange}>
          <Calendar.Header>
            <Calendar.PrevButton />
            <Calendar.Heading />
            <Calendar.NextButton />
          </Calendar.Header>
          <Calendar.Grid />
        </Calendar>
        <Span fontSize="3r" color="design.text.light">
          Range: {range.start ?? '...'} to {range.end ?? '...'}
        </Span>
      </Div>
    )
  },
  MondayFirst: () => {
    const [date, setDate] = React.useState<string | null>('2024-09-18')
    return (
      <Div maxW="80r" display="flex" flexDirection="column" gap="3r">
        <Calendar locale="en-GB" month="2024-09" today="2024-09-10" value={date} onChange={setDate}>
          <Calendar.Header>
            <Calendar.PrevButton />
            <Calendar.Heading />
            <Calendar.NextButton />
          </Calendar.Header>
          <Calendar.Grid />
        </Calendar>
        <Span fontSize="3r" color="design.text.light">Selected: {date ?? 'None'}</Span>
      </Div>
    )
  },
  Constrained: () => {
    const [date, setDate] = React.useState<string | null>(null)
    return (
      <Div maxW="80r" display="flex" flexDirection="column" gap="3r">
        <Calendar
          locale="en-US"
          month="2024-04"
          min="2024-04-05"
          max="2024-04-20"
          isDateUnavailable={(d) => d >= '2024-04-11' && d <= '2024-04-13'}
          value={date}
          onChange={setDate}
        >
          <Calendar.Header>
            <Calendar.PrevButton />
            <Calendar.Heading />
            <Calendar.NextButton />
          </Calendar.Header>
          <Calendar.Grid />
        </Calendar>
        <Span fontSize="3r" color="design.text.light">Selected: {date ?? 'None'}</Span>
      </Div>
    )
  },
}
