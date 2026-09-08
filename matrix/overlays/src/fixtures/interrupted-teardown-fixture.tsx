import * as React from 'react'
import { Overlay } from '@reference-ui/lib'

export function InterruptedTeardownFixture() {
  const [open, setOpen] = React.useState(false)

  return (
    <div data-testid="interrupted-fixture-root">
      <h3>Interrupted Teardown (OV-SCROLL-10)</h3>
      <button data-testid="btn-interrupt-toggle" data-reference-overlay-ignore onClick={() => setOpen(prev => !prev)}>Toggle</button>

      <Overlay open={open} onOpenChange={setOpen} onDismiss={() => setOpen(false)}>
        <Overlay.Content data-testid="interrupt-content" style={{ transition: 'opacity 300ms', position: 'fixed', top: 50, left: 50, padding: 20, background: 'blue', opacity: open ? 1 : 0, zIndex: 2001 }}>
          Interruptable (300ms)
        </Overlay.Content>
      </Overlay>
    </div>
  )
}
