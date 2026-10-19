// Live NumberField demos for the NumberField component page.
// They take nothing and emit the plain plus formatted inputs. Colocated with the page that
// embeds them.
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

/** A currency field and a percent field: the value stays a plain number. */
export function NumberFieldFormatDemo() {
  const [price, setPrice] = useState<number | null>(1250)
  const [discount, setDiscount] = useState<number | null>(0.15)
  return (
    <Div display="flex" flexDirection="column" gap="2r">
      <Label htmlFor="number-field-demo-price">Price</Label>
      <NumberField
        value={price}
        onChange={setPrice}
        locale="en-GB"
        formatOptions={{ style: 'currency', currency: 'GBP' }}
      >
        <NumberField.Group>
          <NumberField.Input id="number-field-demo-price" />
        </NumberField.Group>
      </NumberField>
      <Label htmlFor="number-field-demo-discount">Discount</Label>
      <NumberField
        value={discount}
        onChange={setDiscount}
        locale="en-GB"
        min={0}
        max={1}
        formatOptions={{ style: 'percent' }}
      >
        <NumberField.Group>
          <NumberField.Decrement aria-label="Decrease discount" />
          <NumberField.Input id="number-field-demo-discount" />
          <NumberField.Increment aria-label="Increase discount" />
        </NumberField.Group>
      </NumberField>
    </Div>
  )
}
