import * as React from 'react'
import { Overlay } from '@reference-ui/lib'

function ShadowHost({ id }: { id: string }) {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!ref.current || ref.current.shadowRoot) return
    const shadow = ref.current.attachShadow({ mode: 'open' })
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.setAttribute('data-testid', `shadow-btn-${id}`)
    btn.textContent = `Shadow ${id}`
    shadow.appendChild(btn)
  }, [id])

  return <div ref={ref} data-testid={`shadow-host-${id}`} style={{ margin: '8px 0' }} />
}

export function OutsideFixture() {
  const [open, setOpen] = React.useState(false)
  const [preventOutside, setPreventOutside] = React.useState(false)
  const [eventsLog, setEventsLog] = React.useState<string[]>([])
  const [backdropStopPropagation, setBackdropStopPropagation] = React.useState(false)

  const log = (msg: string) => setEventsLog(prev => [...prev, msg])

  return (
    <div data-testid="outside-fixture-root">
      <h2>Outside Press & Pointer Isolation Fixtures</h2>

      <label>
        <input
          type="checkbox"
          data-testid="chk-prevent-outside"
          checked={preventOutside}
          onChange={e => setPreventOutside(e.target.checked)}
        />
        Prevent Outside Press
      </label>

      <label style={{ marginLeft: 16 }}>
        <input
          type="checkbox"
          data-testid="chk-stop-backdrop-click"
          checked={backdropStopPropagation}
          onChange={e => setBackdropStopPropagation(e.target.checked)}
        />
        Stop Backdrop Click Propagation
      </label>

      <div style={{ marginTop: 12 }}>
        <button
          type="button"
          data-testid="btn-open-outside-dialog"
          onClick={() => {
            log('open')
            setOpen(true)
          }}
        >
          Open Outside Test Dialog
        </button>
      </div>

      <pre data-testid="outside-events-log">{eventsLog.join(',')}</pre>

      <Overlay
        open={open}
        onOpenChange={setOpen}
        onOutsidePress={e => {
          log(`outside:button=${e.button}`)
          if (preventOutside) e.preventDefault()
        }}
        onDismiss={() => {
          log('dismiss')
          setOpen(false)
        }}
      >
        <Overlay.Backdrop
          data-testid="outside-backdrop"
          onClick={e => {
            if (backdropStopPropagation) {
              e.stopPropagation()
              log('backdrop:stopPropagation')
            }
          }}
          style={{ backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000 }}
        />
        <Overlay.Content
          data-testid="outside-content"
          role="dialog"
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#fff',
            padding: 24,
            zIndex: 1001,
            borderRadius: 8,
            minWidth: 280,
          }}
        >
          <h3>Outside Target Dialog</h3>
          <button
            type="button"
            data-testid="btn-inside-click-test"
            onClick={() => log('click:inside')}
          >
            Click Inside Content
          </button>

          {/* Shadow DOM inside Content */}
          <ShadowHost id="inside" />
        </Overlay.Content>
      </Overlay>

      {/* Outside elements */}
      <div style={{ marginTop: 32 }}>
        {/* Shadow DOM outside Content */}
        <ShadowHost id="outside" />

        {/* Extension overlay that stops propagation */}
        <div
          data-testid="extension-overlay"
          onMouseDown={e => e.stopPropagation()}
          onMouseUp={e => e.stopPropagation()}
          onClick={e => {
            e.stopPropagation()
            log('extension:click')
          }}
          style={{
            display: 'inline-block',
            padding: '8px 16px',
            backgroundColor: '#eee',
            border: '1px dashed #999',
          }}
        >
          Extension Sibling (Stops Propagation)
        </div>
      </div>
    </div>
  )
}
