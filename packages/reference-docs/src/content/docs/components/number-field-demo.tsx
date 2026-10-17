import { useState } from 'react'
import { Div, Label } from '@reference-ui/react'
import { NumberField } from '@reference-ui/lib'

/** A quantity field clamped to 0–100 with stepper buttons. */
export function NumberFieldDemo() {
  const [quantity, setQuantity] = useState<number | null>(1)
  return (
    <Div display="flex" flexDirection="column" gap="2r">
      <Label htmlFor="number-field-demo">Quantity</Label>
      <NumberField value={quantity} onChange={setQuantity} locale="en-GB" min={0} max={100}>
        <NumberField.Group>
          <NumberField.Decrement aria-label="Decrease quantity" />
          <NumberField.Input id="number-field-demo" />
          <NumberField.Increment aria-label="Increase quantity" />
        </NumberField.Group>
      </NumberField>
    </Div>
  )
}
