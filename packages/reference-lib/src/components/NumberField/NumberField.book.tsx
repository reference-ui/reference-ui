import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { NumberField } from './index'

export default {
  Default: () => {
    const [value, setValue] = React.useState<number | null>(42)
    return (
      <Div display="flex" flexDirection="column" gap="3r">
        <NumberField value={value} locale="en-US" onChange={setValue} min={0} max={100} step={1}>
          <NumberField.Decrement aria-label="Decrease" />
          <NumberField.Input aria-label="Quantity" />
          <NumberField.Increment aria-label="Increase" />
        </NumberField>
        <Span fontSize="3r" color="design.text.light">Value: {value ?? 'empty'}</Span>
      </Div>
    )
  },
  WithBounds: () => {
    const [value, setValue] = React.useState<number | null>(5)
    return (
      <Div display="flex" flexDirection="column" gap="3r">
        <NumberField value={value} locale="en-US" onChange={setValue} min={1} max={10} step={1}>
          <NumberField.Decrement aria-label="Decrease" />
          <NumberField.Input aria-label="Quantity" />
          <NumberField.Increment aria-label="Increase" />
        </NumberField>
        <Span fontSize="3r" color="design.text.light">Clamped between 1 and 10</Span>
      </Div>
    )
  },
  Disabled: () => (
    <NumberField value={7} locale="en-US" disabled min={0} max={100}>
      <NumberField.Decrement aria-label="Decrease" />
      <NumberField.Input aria-label="Quantity" />
      <NumberField.Increment aria-label="Increase" />
    </NumberField>
  ),
  Snap: () => {
    const [value, setValue] = React.useState<number | null>(null)
    return (
      <Div display="flex" flexDirection="column" gap="3r">
        <NumberField value={value} locale="en-US" onChange={setValue} step={1} commitBehavior="snap">
          <NumberField.Decrement aria-label="Decrease" />
          <NumberField.Input aria-label="Quantity" />
          <NumberField.Increment aria-label="Increase" />
        </NumberField>
        <Span fontSize="3r" color="design.text.light">Type 2.5, commit → 3. Value: {value ?? 'empty'}</Span>
      </Div>
    )
  },
  Validate: () => {
    const [value, setValue] = React.useState<number | null>(5)
    const [invalid, setInvalid] = React.useState('none')
    return (
      <Div display="flex" flexDirection="column" gap="3r">
        <NumberField
          value={value}
          locale="en-US"
          onChange={setValue}
          min={1}
          max={10}
          step={1}
          commitBehavior="validate"
          onInvalidCommit={(attempted, reason) => setInvalid(`${attempted} (${reason})`)}
        >
          <NumberField.Decrement aria-label="Decrease" />
          <NumberField.Input aria-label="Quantity" />
          <NumberField.Increment aria-label="Increase" />
        </NumberField>
        <Span fontSize="3r" color="design.text.light">Value: {value ?? 'empty'} — last rejected: {invalid}</Span>
      </Div>
    )
  },
  Currency: () => {
    const [value, setValue] = React.useState<number | null>(1234.5)
    return (
      <Div display="flex" flexDirection="column" gap="3r">
        <NumberField
          value={value}
          locale="en-US"
          onChange={setValue}
          formatOptions={{ style: 'currency', currency: 'USD' }}
        >
          <NumberField.Decrement aria-label="Decrease" />
          <NumberField.Input aria-label="Price" />
          <NumberField.Increment aria-label="Increase" />
        </NumberField>
        <Span fontSize="3r" color="design.text.light">Plain value: {value ?? 'empty'}</Span>
      </Div>
    )
  },
}
