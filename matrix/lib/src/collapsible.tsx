import * as React from 'react'
import { Collapsible } from '@reference-ui/lib'

export function CollapsibleFixture() {
  const [open, setOpen] = React.useState(false)

  return (
    <div data-testid="collapsible-fixture-root">
      <h1>Collapsible Fixture</h1>

      <Collapsible open={open} onOpenChange={setOpen}>
        <Collapsible.Trigger data-testid="btn-collapsible-trigger">
          Toggle Details
        </Collapsible.Trigger>

        <Collapsible.Content
          data-testid="collapsible-content"
          style={{
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            marginTop: '8px',
          }}
        >
          <p data-testid="collapsible-text">Detailed collapsible content.</p>
        </Collapsible.Content>
      </Collapsible>
    </div>
  )
}
