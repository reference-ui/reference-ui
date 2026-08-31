import * as React from 'react'
import { DateField } from '@reference-ui/lib'

export function DateFieldFixture() {
  const [value, setValue] = React.useState<string | null>('2026-08-15')

  return (
    <div data-testid="date-field-fixture-root">
      <h1>DateField Fixture</h1>

      <div style={{ margin: '16px 0' }}>
        <DateField
          value={value}
          onChange={setValue}
        >
          <DateField.Input data-testid="date-field-input" />
          <DateField.Trigger data-testid="date-field-trigger" />
          <DateField.Picker data-testid="date-field-picker" />
        </DateField>
      </div>

      <p data-testid="date-field-value-display">
        Date Value: {value ?? 'None'}
      </p>
    </div>
  )
}
