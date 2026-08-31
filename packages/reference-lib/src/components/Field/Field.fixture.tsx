import * as React from 'react'
import { Div, Input, Span, Button } from '@reference-ui/react'
import { Field } from './index'

export default {
  Default: () => (
    <Div maxW="80r" display="flex" flexDirection="column" gap="3r">
      <Field width="100%">
        <Input
          placeholder="Enter username..."
          width="100%"
          border="none"
          outline="none"
          bg="transparent"
        />
      </Field>
    </Div>
  ),
  WithPrefixAndSuffix: () => (
    <Div maxW="80r">
      <Field width="100%" gap="2r">
        <Span fontSize="3.5r" color="design.text.light" aria-hidden="true">
          £
        </Span>
        <Input
          placeholder="0.00"
          width="100%"
          border="none"
          outline="none"
          bg="transparent"
        />
        <Button
          type="button"
          aria-label="Clear amount"
          border="none"
          bg="transparent"
          cursor="pointer"
          fontSize="4r"
          color="design.text.light"
        >
          ×
        </Button>
      </Field>
    </Div>
  ),
  WarningStatus: () => (
    <Div maxW="80r" display="flex" flexDirection="column" gap="2r">
      <Field status="warning" width="100%">
        <Input
          placeholder="Review this value..."
          width="100%"
          border="none"
          outline="none"
          bg="transparent"
        />
      </Field>
      <Span fontSize="3r" color="design.text.light">
        Field status=&quot;warning&quot; uses amber border styling.
      </Span>
    </Div>
  ),
}
