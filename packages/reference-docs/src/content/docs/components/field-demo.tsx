// Live Field demos for the Field component page.
// They take nothing and emit the labeled field plus status states. Colocated with the page
// that embeds them.
import { Button, Div, Input, Label, P, Span, css } from '@reference-ui/react'
import { Field } from '@reference-ui/lib'
import { demoNote, demoStack } from './demo-surface'

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

/** An invalid input and a warning input, side by side. */
export function FieldStatusDemo() {
  return (
    <Div className={demoStack}>
      <Label htmlFor="field-demo-email">Email</Label>
      <Field className={fullWidth}>
        <Input
          id="field-demo-email"
          defaultValue="ada@"
          aria-invalid="true"
          aria-describedby="field-demo-email-error"
        />
      </Field>
      <P id="field-demo-email-error" className={demoNote}>
        Enter a full email address.
      </P>
      <Label htmlFor="field-demo-username">Username</Label>
      <Field className={fullWidth} status="warning">
        <Input
          id="field-demo-username"
          defaultValue="ada"
          aria-describedby="field-demo-username-hint"
        />
      </Field>
      <P id="field-demo-username-hint" className={demoNote}>
        Short usernames are easy to guess.
      </P>
    </Div>
  )
}
