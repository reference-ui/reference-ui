import * as React from 'react'
import { Overlay } from '@reference-ui/lib'
import type { OverlayEdge } from '@reference-ui/lib'

export function EdgeFixture() {
  const [edge, setEdge] = React.useState<OverlayEdge>('bottom')
  const [open, setOpen] = React.useState(false)
  const [nestedOpen, setNestedOpen] = React.useState(false)
  const [edgeTriggerOpen, setEdgeTriggerOpen] = React.useState(false)

  return (
    <div data-testid="edge-fixture-root" style={{ minHeight: '300vh', position: 'relative' }}>
      <h2>Edge Sheet & Handle Drag Fixtures</h2>

      {/* OV-EDGE-03: Trigger as opener only when edge is set */}
      <section data-testid="section-edge-trigger" style={{ marginBottom: 16 }}>
        <div data-testid="edge-trigger-source-container">
          <Overlay open={edgeTriggerOpen} onOpenChange={setEdgeTriggerOpen} edge="bottom">
            <Overlay.Trigger data-testid="btn-edge-opener-trigger">
              Open Bottom Edge from Trigger
            </Overlay.Trigger>
            <Overlay.Content
              data-testid="edge-opener-content"
              offset={0}
              style={{
                height: 120,
                background: '#e0f2fe',
                padding: 16,
                zIndex: 1002,
              }}
            >
              <p>Edge Opener Content</p>
              <button
                type="button"
                data-testid="btn-close-edge-opener"
                onClick={() => setEdgeTriggerOpen(false)}
              >
                Close Edge Opener
              </button>
            </Overlay.Content>
          </Overlay>
        </div>
      </section>

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
        <button
          type="button"
          data-testid="btn-open-edge-at-scroll"
          style={{ position: 'absolute', top: 200, left: 16 }}
          onClick={() => {
            setEdge('bottom')
            setOpen(true)
          }}
        >
          Open Sheet at Scroll Y=200
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

          <input
            data-testid="ios-sheet-input"
            placeholder="iOS input"
            style={{ marginBottom: 12, padding: 6, width: '100%' }}
          />

          <div
            data-testid="edge-scroll-inner"
            style={{
              maxHeight: 100,
              overflowY: 'auto',
              border: '1px solid #ccc',
              padding: 8,
              margin: '12px 0',
            }}
          >
            {Array.from({ length: 20 }, (_, i) => (
              <p key={i} data-testid={`edge-scroll-item-${i}`}>
                Scroll item {i + 1}
              </p>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              type="button"
              data-testid="btn-open-nested-sheet"
              onClick={() => setNestedOpen(true)}
            >
              Open Nested Sheet
            </button>
            <button
              type="button"
              data-testid="btn-close-edge"
              onClick={() => setOpen(false)}
            >
              Close Sheet
            </button>
          </div>

          {/* Nested Edge Sheet */}
          <Overlay open={nestedOpen} onOpenChange={setNestedOpen} edge="bottom">
            <Overlay.Content
              data-testid="nested-edge-content"
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: 180,
                backgroundColor: '#f0f0f0',
                padding: 16,
                zIndex: 1002,
              }}
            >
              <Overlay.Handle data-testid="nested-edge-handle" />
              <h4>Nested Edge Sheet</h4>
              <button
                type="button"
                data-testid="btn-close-nested-sheet"
                onClick={() => setNestedOpen(false)}
              >
                Close Nested Sheet
              </button>
            </Overlay.Content>
          </Overlay>
        </Overlay.Content>
      </Overlay>
    </div>
  )
}
