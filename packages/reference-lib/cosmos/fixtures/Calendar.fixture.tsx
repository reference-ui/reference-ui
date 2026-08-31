import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { Calendar, type DateRangeValue } from '../../src/index'

export default {
  SingleDate: () => {
    const [date, setDate] = React.useState<string | null>('2026-08-31')
    return (
      <Div maxW="80r" display="flex" flexDirection="column" gap="3r">
        <Calendar value={date} onChange={setDate}>
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
        <Calendar mode="range" value={range} onChange={setRange}>
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
}
