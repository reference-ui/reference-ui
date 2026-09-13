import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { ReferenceLibrary } from '../ReferenceLibrary'
import { DateField } from './index'

export const CompoundFixture = () => {
  const [value, setValue] = React.useState<string | null>('2026-08-15')

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="date-field-fixture-root">
        <Div style={{ margin: '16px 0' }}>
          <DateField
            value={value}
            onChange={setValue}
          >
            <DateField.Input data-testid="date-field-input" />
            <DateField.Trigger data-testid="date-field-trigger" />
            <DateField.Picker data-testid="date-field-picker" />
          </DateField>
        </Div>

        <Span fontSize="3r" color="design.text.light" data-testid="date-field-value-display">
          Date Value: {value ?? 'None'}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}
