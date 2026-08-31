import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { NumberField } from './index'

export default {
  Default: () => {
    const [value, setValue] = React.useState<number | null>(42)
    return (
      <Div display="flex" flexDirection="column" gap="3r">
        <NumberField value={value} onChange={setValue} min={0} max={100} step={1}>
          <NumberField.Decrement />
          <NumberField.Input />
          <NumberField.Increment />
        </NumberField>
        <Span fontSize="3r" color="design.text.light">Value: {value ?? 'empty'}</Span>
      </Div>
    )
  },
  WithBounds: () => {
    const [value, setValue] = React.useState<number | null>(5)
    return (
      <Div display="flex" flexDirection="column" gap="3r">
        <NumberField value={value} onChange={setValue} min={1} max={10} step={1}>
          <NumberField.Decrement aria-label="Decrease" />
          <NumberField.Input aria-label="Quantity" />
          <NumberField.Increment aria-label="Increase" />
        </NumberField>
        <Span fontSize="3r" color="design.text.light">Clamped between 1 and 10</Span>
      </Div>
    )
  },
  Disabled: () => (
    <NumberField value={7} disabled min={0} max={100}>
      <NumberField.Decrement />
      <NumberField.Input />
      <NumberField.Increment />
    </NumberField>
  ),
}
