import * as React from 'react'
import { Div, Input, Span, Button, Label, P } from '@reference-ui/react'
import { Field } from './index'

export default {
  Default: () => (
    <Div maxW="80r" display="flex" flexDirection="column" gap="2r">
      <Label htmlFor="username">Username</Label>
      <Field width="100%">
        <Input id="username" placeholder="Enter username..." />
      </Field>
    </Div>
  ),
  AlignedWithButton: () => (
    <Div maxW="100r" display="flex" flexDirection="column" gap="3r">
      <Span fontSize="3r" color="design.text.light">
        Field, standalone Input, and Button share the 8.5r control height.
      </Span>
      <Div display="flex" alignItems="center" gap="2r" flexWrap="wrap">
        <Field width="52r">
          <Input placeholder="Search…" aria-label="Search" />
        </Field>
        <Input placeholder="Bare input" aria-label="Bare input" width="52r" />
        <Button type="button">Search</Button>
      </Div>
      <Div display="flex" alignItems="center" gap="2r">
        <Field width="100%">
          <Input placeholder="Full-width field" aria-label="Full-width field" />
        </Field>
        <Button type="button">Submit</Button>
      </Div>
    </Div>
  ),
  WithPrefixAndSuffix: () => (
    <Div maxW="80r" display="flex" flexDirection="column" gap="2r">
      <Label htmlFor="amount">Amount</Label>
      <Field width="100%">
        <Span aria-hidden="true" color="design.text.light">
          £
        </Span>
        <Input id="amount" placeholder="0.00" />
        <Button type="button" aria-label="Clear amount">
          ×
        </Button>
      </Field>
    </Div>
  ),
  WarningStatus: () => (
    <Div maxW="80r" display="flex" flexDirection="column" gap="2r">
      <Label htmlFor="review">Review</Label>
      <Field status="warning" width="100%">
        <Input id="review" placeholder="Review this value..." />
      </Field>
      <P fontSize="3r" color="design.text.light" m="0">
        Warning is Field-owned chrome. Invalid still lives on the input.
      </P>
    </Div>
  ),
  Invalid: () => (
    <Div maxW="80r" display="flex" flexDirection="column" gap="2r">
      <Label htmlFor="email">Email</Label>
      <Field width="100%">
        <Input
          id="email"
          placeholder="you@example.com"
          aria-invalid="true"
          aria-describedby="email-error"
        />
      </Field>
      <P id="email-error" fontSize="3r" color="colors.red.500" m="0">
        Enter a valid email.
      </P>
    </Div>
  ),
  Disabled: () => (
    <Div maxW="80r" display="flex" flexDirection="column" gap="2r">
      <Label htmlFor="locked">Locked</Label>
      <Field width="100%">
        <Input id="locked" placeholder="Cannot edit" disabled />
      </Field>
    </Div>
  ),
}
