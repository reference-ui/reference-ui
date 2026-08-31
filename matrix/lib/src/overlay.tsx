import * as React from 'react'
import { Overlay } from '@reference-ui/lib'

export function OverlayFixture() {
  const [open, setOpen] = React.useState(false)

  return (
    <div data-testid="overlay-fixture-root">
      <h1>Overlay Fixture</h1>

      <Overlay open={open} onOpenChange={setOpen}>
        <Overlay.Trigger data-testid="btn-open-overlay">
          Open Dialog
        </Overlay.Trigger>

        <Overlay.Portal>
          <Overlay.Backdrop
            data-testid="overlay-backdrop"
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 1000,
            }}
          />

          <Overlay.Content
            data-testid="overlay-content"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: '#fff',
              padding: '24px',
              borderRadius: '8px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
              zIndex: 1001,
            }}
          >
            <h2 data-testid="overlay-title">Dialog Title</h2>
            <p>Dialog description content.</p>

            <button type="button" data-testid="btn-inside-first">
              First Action
            </button>
            <button
              type="button"
              data-testid="btn-close-overlay"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </Overlay.Content>
        </Overlay.Portal>
      </Overlay>

      <button type="button" data-testid="btn-outside-element">
        Outside Button
      </button>
    </div>
  )
}
