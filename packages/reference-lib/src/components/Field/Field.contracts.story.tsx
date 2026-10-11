/**
 * A decorative Field wraps native successful controls in a real form.
 * Parent status changes expose whether the bezel preserves native editing and validation state.
 */
import * as React from 'react'
import { Button, Input, Label, Option, Select, Textarea } from '@reference-ui/react'
import { Field } from './index'

export function NativeControlsFixture({ warning = false }: { warning?: boolean }) {
  const [submission, setSubmission] = React.useState('none')
  return (
    <form
      data-testid="field-native-form"
      onSubmit={event => {
        event.preventDefault()
        setSubmission(JSON.stringify(Array.from(new FormData(event.currentTarget).entries())))
      }}
    >
      <Label htmlFor="field-native-email">Account email</Label>
      <Field data-testid="field-native-bezel" status={warning ? 'warning' : undefined}>
        <Input id="field-native-email" name="email" type="email" required />
      </Field>
      <Label htmlFor="field-native-note">Account note</Label>
      <Field>
        <Textarea id="field-native-note" name="note" defaultValue="Initial note" />
      </Field>
      <Label htmlFor="field-native-region">Region</Label>
      <Field>
        <Select id="field-native-region" name="region" defaultValue="uk">
          <Option value="uk">United Kingdom</Option>
          <Option value="fr">France</Option>
        </Select>
      </Field>
      <Field>
        <Input aria-label="Account identifier" name="account" value="account-7" readOnly />
      </Field>
      <Field>
        <Input aria-label="Unavailable metadata" name="unavailable" defaultValue="private" disabled />
      </Field>
      <Button type="submit">Save account</Button>
      <Button type="reset">Reset account</Button>
      <output data-testid="field-native-submission">{submission}</output>
    </form>
  )
}
