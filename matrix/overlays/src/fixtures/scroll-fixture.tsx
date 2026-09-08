import * as React from 'react'
import { Overlay } from '@reference-ui/lib'

export function ScrollFixture() {
  const [open, setOpen] = React.useState(false)

  return (
    <div data-testid="scroll-fixture-root" style={{ minHeight: '300vh', position: 'relative' }}>
      <h2>Scroll Lock & Viewport Fixtures</h2>
      <p>This page is 300vh tall to test scroll position preservation.</p>

      {/* Button placed at scroll offset 240px */}
      <button
        type="button"
        data-testid="btn-open-at-scroll"
        style={{ position: 'absolute', top: 240, left: 24 }}
        onClick={() => setOpen(true)}
      >
        Open Dialog at Y=240
      </button>

      <Overlay open={open} onOpenChange={setOpen}>
        <Overlay.Backdrop
          data-testid="scroll-backdrop"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }}
        />
        <Overlay.Content
          data-testid="scroll-content"
          role="dialog"
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#fff',
            padding: 24,
            borderRadius: 8,
            width: 320,
            zIndex: 1001,
          }}
        >
          <h3>Scrollable Overlay</h3>
          <p>Inner scroll container below:</p>

          <div
            data-testid="scrollable-content-inner"
            style={{
              maxHeight: 120,
              overflowY: 'auto',
              border: '1px solid #ddd',
              padding: 8,
              marginTop: 12,
            }}
          >
            <p>Inner line 1</p>
            <p>Inner line 2</p>
            <p>Inner line 3</p>
            <p>Inner line 4</p>
            <p>Inner line 5</p>
            <p>Inner line 6</p>
            <p>Inner line 7</p>
            <p>Inner line 8</p>
            <p>Inner line 9</p>
            <p>Inner line 10</p>
          </div>

          <div style={{ marginTop: 16 }}>
            <button
              type="button"
              data-testid="btn-close-scroll-dialog"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
        </Overlay.Content>
      </Overlay>
    </div>
  )
}
