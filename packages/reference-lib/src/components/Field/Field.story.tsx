import * as React from 'react'
import { Div, Button, Input, Span } from '@reference-ui/react'
import { ReferenceLibrary } from '../ReferenceLibrary'
import { Field } from './index'

export const StatusAndFocusFixture = () => {
  const [warning, setWarning] = React.useState(false)

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="field-fixture-root" display="flex" flexDirection="column" gap="4r">
        <Button
          type="button"
          data-testid="btn-toggle-warning"
          onClick={() => setWarning(w => !w)}
        >
          Toggle Warning
        </Button>

        <Field
          data-testid="test-field"
          status={warning ? 'warning' : undefined}
          width="100%"
        >
          <input
            data-testid="field-input"
            aria-invalid="true"
            placeholder="Enclosed input"
            style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', color: 'inherit' }}
          />
        </Field>

        <Field data-testid="standard-field" width="100%">
          <input
            data-testid="standard-field-input"
            placeholder="Standard input"
            style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', color: 'inherit' }}
          />
        </Field>
      </Div>
    </ReferenceLibrary>
  )
}

export const PrefixAndSuffix = () => (
  <ReferenceLibrary>
    <Div p="4r" maxW="80r">
      <Field width="100%" data-testid="prefix-suffix-field">
        <Span aria-hidden="true" color="design.text.light">
          £
        </Span>
        <Input id="amount" placeholder="0.00" />
        <Button type="button" aria-label="Clear amount">
          ×
        </Button>
      </Field>
    </Div>
  </ReferenceLibrary>
)
