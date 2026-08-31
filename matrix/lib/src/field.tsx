import * as React from 'react'
import { Field } from '@reference-ui/lib'

export function FieldFixture() {
  const [warning, setWarning] = React.useState(false)

  return (
    <div data-testid="field-fixture-root">
      <h1>Field Fixture</h1>

      <button
        type="button"
        data-testid="btn-toggle-warning"
        onClick={() => setWarning(w => !w)}
      >
        Toggle Warning
      </button>

      <div style={{ margin: '16px 0' }}>
        <Field
          data-testid="test-field"
          status={warning ? 'warning' : undefined}
        >
          <input
            data-testid="field-input"
            aria-invalid="true"
            placeholder="Enclosed input"
            style={{ border: 'none', outline: 'none', background: 'transparent' }}
          />
        </Field>
      </div>
    </div>
  )
}
