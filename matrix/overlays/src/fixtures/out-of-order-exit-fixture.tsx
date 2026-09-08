import * as React from 'react'
import { Overlay } from '@reference-ui/lib'

export function OutOfOrderExitFixture() {
  const [open1, setOpen1] = React.useState(false)
  const [open2, setOpen2] = React.useState(false)

  return (
    <div data-testid="ooo-exit-fixture">
      <h3>Out of order exit (OV-INERT-03 / OV-SCROLL-05)</h3>
      <button data-testid="btn-ooo-all" onClick={() => { setOpen1(true); setOpen2(true); }}>Open Both</button>
      <button data-testid="btn-ooo-close-1" data-reference-overlay-ignore onClick={() => setOpen1(false)}>Close 1</button>
      <button data-testid="btn-ooo-close-2" data-reference-overlay-ignore onClick={() => setOpen2(false)}>Close 2</button>

      <Overlay open={open1} onOpenChange={setOpen1} onDismiss={() => setOpen1(false)}>
        <Overlay.Content data-testid="ooo-content-1" style={{ transition: 'opacity 300ms', position: 'fixed', top: 50, left: 50, padding: 20, background: 'red', opacity: open1 ? 1 : 0, zIndex: 2001 }}>Layer 1 (300ms)</Overlay.Content>
      </Overlay>
      <Overlay open={open2} onOpenChange={setOpen2} onDismiss={() => setOpen2(false)}>
        <Overlay.Content data-testid="ooo-content-2" style={{ transition: 'opacity 100ms', position: 'fixed', top: 100, left: 100, padding: 20, background: 'green', opacity: open2 ? 1 : 0, zIndex: 2002 }}>Layer 2 (100ms)</Overlay.Content>
      </Overlay>
    </div>
  )
}
