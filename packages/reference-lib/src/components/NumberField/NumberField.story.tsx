import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { ReferenceLibrary } from '../ReferenceLibrary'
import { NumberField } from './index'

export const StepperFixture = () => {
  const [value, setValue] = React.useState<number | null>(42)

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="number-field-fixture-root">
        <Div style={{ margin: '16px 0', width: 220 }}>
          <NumberField
            data-testid="number-field-root"
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
        </Div>

        <Span fontSize="3r" color="design.text.light" data-testid="number-field-value-display">
          Numeric Value: {value !== null ? value : 'None'}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const DisabledFixture = () => (
  <ReferenceLibrary>
    <Div p="4r" maxW="80r">
      <NumberField value={7} disabled min={0} max={100} data-testid="disabled-number-field">
        <NumberField.Decrement />
        <NumberField.Input />
        <NumberField.Increment />
      </NumberField>
    </Div>
  </ReferenceLibrary>
)
