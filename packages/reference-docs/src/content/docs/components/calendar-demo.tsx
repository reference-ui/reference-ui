import { useState } from 'react'
import { Calendar, type DateRangeValue, type ISODate } from '@reference-ui/lib'

/** A single-date calendar; `today` is fixed so the page renders the same month. */
export function CalendarDemo() {
  const [date, setDate] = useState<ISODate | null>(null)
  return <Calendar value={date} onChange={setDate} locale="en-GB" today="2026-10-17" />
}

/** A range calendar: the first click sets the start, the second sets the end. */
export function CalendarRangeDemo() {
  const [stay, setStay] = useState<DateRangeValue | null>(null)
  return (
    <Calendar mode="range" value={stay} onChange={setStay} locale="en-GB" today="2026-10-17" />
  )
}
