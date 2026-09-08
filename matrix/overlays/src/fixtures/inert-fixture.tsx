import * as React from 'react'
import { Overlay } from '@reference-ui/lib'

export function InertFixture() {
  const [open, setOpen] = React.useState(false)
  const [siblingClicks, setSiblingClicks] = React.useState(0)

  return (
    <div data-testid="inert-fixture-root">
      <h2>Inert Background Isolation Fixtures</h2>

      {/* Sibling normal content */}
      <div data-testid="inert-sibling-container" style={{ padding: 16, border: '1px solid #ccc' }}>
        <h3>Background Sibling Content</h3>
        <button
          type="button"
          data-testid="btn-sibling-clickable"
          onClick={() => setSiblingClicks(c => c + 1)}
        >
          Sibling Button (Clicks: {siblingClicks})
        </button>
      </div>

      {/* Sibling Live Region */}
      <div
        aria-live="polite"
        data-testid="sibling-live-region"
        style={{ marginTop: 16, padding: 8, backgroundColor: '#f0f0f0' }}
      >
        Live Region Announcement Container
      </div>

      {/* Sibling Toast Host */}
      <div
        data-reference-toast-host=""
        data-testid="sibling-toast-host"
        style={{ marginTop: 16, padding: 8, backgroundColor: '#eef' }}
      >
        Toast Host Container
      </div>

      <div style={{ marginTop: 24 }}>
        <Overlay open={open} onOpenChange={setOpen} onOutsidePress={e => e.preventDefault()}>
          <Overlay.Trigger data-testid="btn-open-inert-dialog">
            Open Isolating Overlay
          </Overlay.Trigger>
          <Overlay.Backdrop
            data-testid="inert-backdrop"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000 }}
          />
          <Overlay.Content
            data-testid="inert-content"
            role="dialog"
            aria-modal="true"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: '#fff',
              padding: 24,
              borderRadius: 8,
              zIndex: 1001,
            }}
          >
            <h3>Modal Dialog with Inert Background</h3>
            <button
              type="button"
              data-testid="btn-close-inert-dialog"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </Overlay.Content>
        </Overlay>
      </div>
    </div>
  )
}
