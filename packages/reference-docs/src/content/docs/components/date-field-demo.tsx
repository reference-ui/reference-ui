// Live DateField demos for the DateField component page.
// They take nothing and emit single-date and range inputs. Colocated with the page that
// embeds them.
import { useState } from 'react'
import { Div, Label } from '@reference-ui/react'
import { DateField, type DateRangeValue, type ISODate } from '@reference-ui/lib'

/** A typed date field with a labelled calendar trigger and the default picker. */
export function DateFieldDemo() {
  const [date, setDate] = useState<ISODate | null>('2026-10-17')
  return (
    <Div display="flex" flexDirection="column" gap="2r">
      <Label htmlFor="date-field-demo">Start date</Label>
      <DateField id="date-field-demo" value={date} onChange={setDate} locale="en-GB">
        <DateField.Input />
        <DateField.Trigger aria-label="Open calendar" />
        <DateField.Picker />
      </DateField>
    </Div>
  )
}

/** A start and end pair sharing one range picker. */
export function DateFieldRangeDemo() {
  const [stay, setStay] = useState<DateRangeValue | null>(null)
  return (
    <DateField.Range value={stay} onChange={setStay} locale="en-GB">
      <DateField.Start aria-label="Check-in" />
      <DateField.End aria-label="Check-out" />
      <DateField.Trigger aria-label="Open calendar" />
      <DateField.Picker />
    </DateField.Range>
  )
}
