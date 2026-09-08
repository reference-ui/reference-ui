import * as React from 'react'
import { Overlay } from '@reference-ui/lib'

export function StrictModeFixture() {
  const [open, setOpen] = React.useState(false)

  return (
    <React.StrictMode>
      <div data-testid="strict-mode-root">
        <h3>Strict Mode (OV-ENV-04)</h3>
        <button data-testid="btn-strict-toggle" onClick={() => setOpen(prev => !prev)}>Toggle Strict</button>

        <Overlay open={open} onOpenChange={setOpen} onDismiss={() => setOpen(false)}>
          <Overlay.Content data-testid="strict-content" style={{ position: 'fixed', top: 50, left: 50, padding: 20, background: 'orange', zIndex: 2001 }}>
            Strict Mode Modal
          </Overlay.Content>
        </Overlay>
      </div>
    </React.StrictMode>
  )
}
