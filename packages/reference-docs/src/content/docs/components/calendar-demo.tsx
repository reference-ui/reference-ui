import { useState } from 'react'
import { Calendar, type ISODate } from '@reference-ui/lib'

/** A single-date calendar; `today` is fixed so the page renders the same month. */
export function CalendarDemo() {
  const [date, setDate] = useState<ISODate | null>(null)
  return <Calendar value={date} onChange={setDate} locale="en-GB" today="2026-10-17" />
}
