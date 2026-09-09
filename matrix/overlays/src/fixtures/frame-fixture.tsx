import * as React from 'react'
import { Overlay } from '@reference-ui/lib'

/** Minimal Overlay for same-origin iframe stack isolation (OV-ESC-05, OV-LAYER-10). */
export function FrameFixture() {
  const [open, setOpen] = React.useState(false)
  const [log, setLog] = React.useState<string[]>([])

  return (
    <div data-testid="frame-fixture-root" style={{ padding: 16 }}>
      <h2>Iframe Overlay</h2>
      <button
        type="button"
        data-testid="btn-frame-open"
        onClick={() => {
          setLog(['open'])
          setOpen(true)
        }}
      >
        Open Frame Overlay
      </button>
      <pre data-testid="frame-log">{log.join(',')}</pre>
      <Overlay
        open={open}
        onOpenChange={setOpen}
        onEscape={() => setLog(l => [...l, 'escape'])}
        onOutsidePress={() => setLog(l => [...l, 'outside'])}
        onDismiss={() => {
          setLog(l => [...l, 'dismiss'])
          setOpen(false)
        }}
      >
        <Overlay.Backdrop
          data-testid="frame-backdrop"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1000 }}
        />
        <Overlay.Content
          data-testid="frame-content"
          role="dialog"
          style={{
            position: 'fixed',
            top: '30%',
            left: '20%',
            background: '#fff',
            padding: 16,
            zIndex: 1001,
          }}
        >
          <p>Frame dialog</p>
          <button type="button" data-testid="btn-frame-inner">
          Frame inner
        </button>
        <button type="button" data-testid="btn-frame-close" onClick={() => setOpen(false)}>
            Close
          </button>
        </Overlay.Content>
      </Overlay>
    </div>
  )
}
