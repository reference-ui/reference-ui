import { useState } from 'react'
import { Div, Label } from '@reference-ui/react'
import { DateField, type ISODate } from '@reference-ui/lib'

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
