import * as React from 'react'
import { Overlay } from '@reference-ui/lib'
import type { OverlayEdge } from '@reference-ui/lib'

export function EdgeFixture() {
  const [edge, setEdge] = React.useState<OverlayEdge>('bottom')
  const [open, setOpen] = React.useState(false)

  return (
    <div data-testid="edge-fixture-root">
      <h2>Edge Sheet & Handle Drag Fixtures</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          data-testid="btn-open-edge-bottom"
          onClick={() => {
            setEdge('bottom')
            setOpen(true)
          }}
        >
          Open Bottom Sheet
        </button>
        <button
          type="button"
          data-testid="btn-open-edge-top"
          onClick={() => {
            setEdge('top')
            setOpen(true)
          }}
        >
          Open Top Sheet
        </button>
        <button
          type="button"
          data-testid="btn-open-edge-left"
          onClick={() => {
            setEdge('left')
            setOpen(true)
          }}
        >
          Open Left Sheet
        </button>
        <button
          type="button"
          data-testid="btn-open-edge-right"
          onClick={() => {
            setEdge('right')
            setOpen(true)
          }}
        >
          Open Right Sheet
        </button>
      </div>

      <Overlay open={open} onOpenChange={setOpen} edge={edge}>
        <Overlay.Backdrop
          data-testid="edge-backdrop"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000 }}
        />
        <Overlay.Content
          data-testid="edge-content"
          role="dialog"
          style={{
            backgroundColor: '#fff',
            padding: 24,
            minHeight: edge === 'bottom' || edge === 'top' ? 240 : undefined,
            minWidth: edge === 'left' || edge === 'right' ? 240 : undefined,
            zIndex: 1001,
          }}
        >
          <Overlay.Handle data-testid="edge-handle" />
          <h3 data-testid="edge-title">{edge.toUpperCase()} Sheet</h3>
          <p>Drag handle in dismiss direction to close.</p>
          <button
            type="button"
            data-testid="btn-close-edge"
            onClick={() => setOpen(false)}
          >
            Close Sheet
          </button>
        </Overlay.Content>
      </Overlay>
    </div>
  )
}
