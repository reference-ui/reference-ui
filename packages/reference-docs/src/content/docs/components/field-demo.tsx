import { Button, Div, Input, Label, Span, css } from '@reference-ui/react'
import { Field } from '@reference-ui/lib'
import { demoStack } from './demo-surface'

const fullWidth = css({ width: '100%' })

/** An amount input with a currency prefix and a clear button inside one bezel. */
export function FieldDemo() {
  return (
    <Div className={demoStack}>
      <Label htmlFor="field-demo-amount">Amount</Label>
      <Field className={fullWidth}>
        <Span aria-hidden="true">£</Span>
        <Input id="field-demo-amount" placeholder="0.00" />
        <Button type="button" aria-label="Clear amount">
          ×
        </Button>
      </Field>
    </Div>
  )
}
