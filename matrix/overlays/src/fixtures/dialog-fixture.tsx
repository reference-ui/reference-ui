import * as React from 'react'
import { Overlay } from '@reference-ui/lib'

export function DialogFixture() {
  const [open, setOpen] = React.useState(false)
  const [unboundOpen, setUnboundOpen] = React.useState(false)
  const [controlledOpen, setControlledOpen] = React.useState(false)
  const [rejectOpen, setRejectOpen] = React.useState(false)
  const [escapeLog, setEscapeLog] = React.useState<string[]>([])
  const [rejectLog, setRejectLog] = React.useState<string[]>([])

  return (
    <div data-testid="dialog-fixture-root">
      <h2>Dialog & DOM Anatomy Fixtures</h2>

      {/* 1. Basic Isolating Dialog */}
      <section data-testid="section-basic-dialog">
        <Overlay open={open} onOpenChange={setOpen}>
          <Overlay.Trigger data-testid="btn-open-basic-dialog">
            Open Basic Dialog
          </Overlay.Trigger>
          <Overlay.Backdrop
            data-testid="dialog-backdrop"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000 }}
          />
          <Overlay.Content
            data-testid="dialog-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
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
            <h2 id="dialog-title" data-testid="dialog-title">
              Dialog Title
            </h2>
            <p data-testid="dialog-description">Dialog description text.</p>
            <button type="button" data-testid="btn-dialog-first">
              First Action
            </button>
            <button
              type="button"
              data-testid="btn-dialog-close"
              onClick={() => setOpen(false)}
            >
              Close Dialog
            </button>
          </Overlay.Content>
        </Overlay>
      </section>

      {/* 2. Unbound Content (no trigger, no overlay coords) */}
      <section data-testid="section-unbound-dialog" style={{ marginTop: 24 }}>
        <button
          type="button"
          data-testid="btn-open-unbound"
          onClick={() => setUnboundOpen(true)}
        >
          Open Unbound
        </button>
        <Overlay open={unboundOpen} onOpenChange={setUnboundOpen}>
          <Overlay.Content data-testid="dialog-unbound-content" role="dialog">
            <h3 data-testid="unbound-title">Unbound Custom Surface</h3>
            <button
              type="button"
              data-testid="btn-close-unbound"
              onClick={() => setUnboundOpen(false)}
            >
              Close Unbound
            </button>
          </Overlay.Content>
        </Overlay>
      </section>

      {/* 3. Pure Controlled Open */}
      <section data-testid="section-controlled-dialog" style={{ marginTop: 24 }}>
        <button
          type="button"
          data-testid="btn-set-controlled-open"
          onClick={() => setControlledOpen(true)}
        >
          Open Controlled
        </button>
        <button
          type="button"
          data-testid="btn-set-controlled-closed"
          data-reference-overlay-ignore=""
          onClick={() => setControlledOpen(false)}
        >
          Close Controlled
        </button>
        <Overlay
          open={controlledOpen}
          isolation={false}
          onEscape={() => setEscapeLog(l => [...l, 'escape'])}
          onDismiss={() => {
            setEscapeLog(l => [...l, 'dismiss'])
            setControlledOpen(false)
          }}
        >
          <Overlay.Content
            data-testid="dialog-controlled-content"
            role="dialog"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: '#fff',
              padding: 24,
            }}
          >
            <p>Controlled Body</p>
            <button type="button" data-testid="btn-controlled-inner">
              Inside Controlled
            </button>
          </Overlay.Content>
        </Overlay>
        <div data-testid="controlled-escape-log">{escapeLog.join(',')}</div>
      </section>

      {/* 4. Parent Rejects Dismissal */}
      <section data-testid="section-reject-dialog" style={{ marginTop: 24 }}>
        <button
          type="button"
          data-testid="btn-open-reject"
          onClick={() => setRejectOpen(true)}
        >
          Open Reject
        </button>
        <Overlay
          open={rejectOpen}
          onEscape={() => setRejectLog(l => [...l, 'escape-called'])}
          onOutsidePress={() => setRejectLog(l => [...l, 'outside-called'])}
          onDismiss={() => {
            setRejectLog(l => [...l, 'dismiss-rejected'])
          }}
        >
          <Overlay.Backdrop
            data-testid="dialog-reject-backdrop"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 1000 }}
          />
          <Overlay.Content
            data-testid="dialog-reject-content"
            role="dialog"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: '#fff',
              padding: 24,
              zIndex: 1001,
            }}
          >
            <p>Non-dismissible until explicit accept</p>
            <button type="button" data-testid="btn-reject-inner">
              Reject Inner
            </button>
            <button
              type="button"
              data-testid="btn-reject-force-close"
              onClick={() => setRejectOpen(false)}
            >
              Force Close
            </button>
          </Overlay.Content>
        </Overlay>
        <div data-testid="reject-log">{rejectLog.join(',')}</div>
      </section>
    </div>
  )
}
