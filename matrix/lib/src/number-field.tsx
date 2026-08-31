import * as React from 'react'
import { NumberField } from '@reference-ui/lib'

export function NumberFieldFixture() {
  const [value, setValue] = React.useState<number | null>(42)

  return (
    <div data-testid="number-field-fixture-root">
      <h1>NumberField Fixture</h1>

      <div style={{ margin: '16px 0' }}>
        <NumberField
          value={value}
          onChange={setValue}
          min={0}
          max={100}
          step={1}
        >
          <NumberField.Decrement data-testid="btn-decrement" />
          <NumberField.Input data-testid="number-field-input" />
          <NumberField.Increment data-testid="btn-increment" />
        </NumberField>
      </div>

      <p data-testid="number-field-value-display">
        Numeric Value: {value !== null ? value : 'None'}
      </p>
    </div>
  )
}
