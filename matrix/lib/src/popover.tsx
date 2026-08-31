import * as React from 'react'
import { Popover } from '@reference-ui/lib'

export function PopoverFixture() {
  const [open, setOpen] = React.useState(false)

  return (
    <div data-testid="popover-fixture-root">
      <h1>Popover Fixture</h1>

      <Popover open={open} onOpenChange={setOpen}>
        <Popover.Trigger data-testid="btn-popover-trigger">
          Open Popover
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            data-testid="popover-content"
            style={{
              position: 'fixed',
              top: '100px',
              left: '100px',
              background: '#fff',
              border: '1px solid #ccc',
              padding: '16px',
              borderRadius: '4px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 1000,
            }}
          >
            <Popover.Arrow data-testid="popover-arrow" />
            <h3 data-testid="popover-title">Popover Header</h3>
            <p>Non-modal popover content</p>
            <input data-testid="popover-input" placeholder="Type here" />
            <Popover.Close data-testid="btn-popover-close">
              Close Popover
            </Popover.Close>
          </Popover.Content>
        </Popover.Portal>
      </Popover>

      <button type="button" data-testid="btn-outside">
        Outside Button
      </button>
    </div>
  )
}
