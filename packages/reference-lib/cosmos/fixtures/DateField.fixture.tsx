import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { DateField, Field, Calendar } from '../../src/index'

export default {
  WithPicker: () => {
    const [value, setValue] = React.useState<string | null>('2026-08-31')
    return (
      <Div maxW="80r" display="flex" flexDirection="column" gap="3r">
        <DateField value={value} onChange={setValue}>
          <Field>
            <DateField.Input border="none" outline="none" bg="transparent" />
            <DateField.Trigger />
          </Field>
          <DateField.Picker>
            <Calendar value={value} onChange={setValue}>
              <Calendar.Header>
                <Calendar.PrevButton />
                <Calendar.Heading />
                <Calendar.NextButton />
              </Calendar.Header>
              <Calendar.Grid />
            </Calendar>
          </DateField.Picker>
        </DateField>
        <Span fontSize="3r" color="design.text.light">Chosen date: {value ?? 'None'}</Span>
      </Div>
    )
  },
}
