import * as React from 'react'
import { Overlay } from '@reference-ui/lib'

export function InertFixture() {
  const [open, setOpen] = React.useState(false)
  const [siblingClicks, setSiblingClicks] = React.useState(0)

  const [openInert07, setOpenInert07] = React.useState(false)
  const [inert07Log, setInert07Log] = React.useState<string[]>([])
  const authoredInertRef = React.useRef<HTMLDivElement | null>(null)
  const inert07ContainerRef = React.useRef<HTMLDivElement | null>(null)
  const [inert07Mounted, setInert07Mounted] = React.useState(false)
  React.useEffect(() => {
    authoredInertRef.current?.setAttribute('inert', '')
    setInert07Mounted(true)
  }, [])

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

      <hr style={{ margin: '24px 0' }} />

      {/* OV-INERT-04: Dynamic insert / reparent while modal is active */}
      <section data-testid="section-ov-inert-04">
        <h3>OV-INERT-04: Dynamic insert and reparent</h3>
        <p>
          Open the isolating overlay above, then use the test to insert and reparent
          nodes while the observer is live.
        </p>
        <div data-testid="inert-04-outside-host" style={{ padding: 8, border: '1px dashed #999' }}>
          Outside host for reparenting
        </div>
      </section>

      <hr style={{ margin: '24px 0' }} />

      {/* OV-INERT-07: Restore once on exit; cancel restore on reopen */}
      <section
        ref={inert07ContainerRef}
        data-testid="section-ov-inert-07"
        style={{ marginTop: 24, border: '1px solid #ddd', padding: 12 }}
      >
        <h3>OV-INERT-07: Inert restore once / cancel on reopen</h3>
        <style>{`
          .inert-07-backdrop {
            transition: opacity 250ms linear !important;
            opacity: 1;
          }
          .inert-07-backdrop[data-state="closed"] {
            opacity: 0;
          }
          .inert-07-content {
            transition: opacity 250ms linear !important;
            opacity: 1;
          }
          .inert-07-content[data-state="closed"] {
            opacity: 0;
          }
        `}</style>
        <div ref={authoredInertRef} data-testid="inert-07-authored-inert" style={{ padding: 8 }}>
          Authored inert sibling
        </div>
        <div data-testid="inert-07-authored-aria" aria-hidden="true" style={{ padding: 8 }}>
          Authored aria-hidden sibling
        </div>
        <div data-testid="inert-07-ordinary" style={{ padding: 8 }}>
          Ordinary sibling
        </div>
        <button
          type="button"
          data-testid="btn-open-inert-07"
          onClick={() => {
            setInert07Log(['open'])
            setOpenInert07(true)
          }}
        >
          Open Inert-07
        </button>
        <pre data-testid="inert-07-log">{inert07Log.join(',')}</pre>
        <Overlay
          open={openInert07}
          onOpenChange={setOpenInert07}
          onDismiss={() => {
            setInert07Log(l => [...l, 'dismiss'])
            setOpenInert07(false)
          }}
        >
          {inert07Mounted && inert07ContainerRef.current && (
            <Overlay.Portal container={inert07ContainerRef.current}>
              <Overlay.Backdrop
                data-testid="inert-07-backdrop"
                className="inert-07-backdrop"
                style={{ backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000 }}
              />
              <Overlay.Content
                data-testid="inert-07-content"
                className="inert-07-content"
                role="dialog"
                style={{
                  position: 'fixed',
                  top: '30%',
                  left: '30%',
                  background: '#fff',
                  padding: 24,
                  zIndex: 1001,
                }}
              >
                <p>Inert-07 dialog</p>
                <button
                  type="button"
                  data-testid="btn-inert-07-reopen"
                  onClick={() => {
                    setOpenInert07(false)
                    setTimeout(() => setOpenInert07(true), 50)
                  }}
                >
                  Close then Reopen
                </button>
                <button
                  type="button"
                  data-testid="btn-close-inert-07"
                  onClick={() => setOpenInert07(false)}
                >
                  Close
                </button>
              </Overlay.Content>
            </Overlay.Portal>
          )}
        </Overlay>
      </section>
    </div>
  )
}
