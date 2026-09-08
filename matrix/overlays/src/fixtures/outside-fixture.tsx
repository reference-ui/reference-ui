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

  // OV-OUT-04: Same-tick opening pointerdown
  const [openSameTick, setOpenSameTick] = React.useState(false)
  const [sameTickLog, setSameTickLog] = React.useState<string[]>([])

  // OV-OUT-11: Modeless outside without Backdrop
  const [openNoBackdrop, setOpenNoBackdrop] = React.useState(false)
  const [preventNoBackdrop, setPreventNoBackdrop] = React.useState(false)
  const [noBackdropLog, setNoBackdropLog] = React.useState<string[]>([])
  const [bgControlClicks, setBgControlClicks] = React.useState(0)

  // OV-OUT-06: Touch delayed dismissal
  const [openTouch, setOpenTouch] = React.useState(false)
  const [touchLog, setTouchLog] = React.useState<string[]>([])

  // OV-FOCUS-09: Focus movement is not outside dismiss
  const [openFocusMove, setOpenFocusMove] = React.useState(false)
  const [focusMoveLog, setFocusMoveLog] = React.useState<string[]>([])

  // OV-ISO-04: Defer only when inert
  const [openIsoTrue, setOpenIsoTrue] = React.useState(false)
  const [openIsoFalse, setOpenIsoFalse] = React.useState(false)
  const [isoLog, setIsoLog] = React.useState<string[]>([])

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

        {/* OV-OUT-07: Unregistered extension overlay that stops later mouse events */}
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
            pointerEvents: 'auto',
            position: 'relative',
            zIndex: 10000,
          }}
        >
          Extension Sibling (Stops Propagation)
          <button
            type="button"
            data-testid="btn-extension-control"
            onMouseDown={e => e.stopPropagation()}
            onMouseUp={e => e.stopPropagation()}
            onClick={e => {
              e.stopPropagation()
              log('extension:activate')
            }}
            style={{ marginLeft: 8 }}
          >
            Extension Control
          </button>
        </div>
      </div>

      <hr style={{ margin: '32px 0' }} />

      {/* OV-OUT-04: Same-tick pointerdown */}
      <section data-testid="section-ov-out-04">
        <h3>OV-OUT-04: Same-tick Opening PointerDown</h3>
        <button
          type="button"
          data-testid="btn-open-same-tick"
          onPointerDown={() => {
            setSameTickLog(l => [...l, 'pointerdown:open'])
            setOpenSameTick(true)
          }}
        >
          Open Same Tick
        </button>
        <pre data-testid="same-tick-log">{sameTickLog.join(',')}</pre>
        <Overlay
          open={openSameTick}
          onOpenChange={setOpenSameTick}
          onOutsidePress={() => setSameTickLog(l => [...l, 'outside'])}
          onDismiss={() => {
            setSameTickLog(l => [...l, 'dismiss'])
            setOpenSameTick(false)
          }}
        >
          <Overlay.Backdrop
            data-testid="same-tick-backdrop"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 1000 }}
          />
          <Overlay.Content
            data-testid="same-tick-content"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: '#fff',
              padding: 20,
              zIndex: 1001,
            }}
          >
            <p>Same Tick Dialog</p>
          </Overlay.Content>
        </Overlay>
      </section>

      <hr style={{ margin: '32px 0' }} />

      {/* OV-OUT-11: Modeless outside without Backdrop */}
      <section data-testid="section-ov-out-11">
        <h3>OV-OUT-11: Modeless Outside without Backdrop</h3>
        <label>
          <input
            type="checkbox"
            data-testid="chk-prevent-no-backdrop"
            checked={preventNoBackdrop}
            onChange={e => setPreventNoBackdrop(e.target.checked)}
          />
          Prevent No-Backdrop Outside
        </label>
        <button
          type="button"
          data-testid="btn-open-no-backdrop"
          style={{ marginLeft: 12 }}
          onClick={() => {
            setNoBackdropLog(l => [...l, 'open'])
            setOpenNoBackdrop(true)
          }}
        >
          Open No-Backdrop
        </button>
        <button
          type="button"
          data-testid="btn-bg-control"
          style={{ marginLeft: 12 }}
          onClick={() => {
            setBgControlClicks(c => c + 1)
            setNoBackdropLog(l => [...l, 'bg-click'])
          }}
        >
          Background Control ({bgControlClicks})
        </button>
        <pre data-testid="no-backdrop-log">{noBackdropLog.join(',')}</pre>

        <Overlay
          open={openNoBackdrop}
          onOpenChange={setOpenNoBackdrop}
          onOutsidePress={e => {
            setNoBackdropLog(l => [...l, 'outside'])
            if (preventNoBackdrop) e.preventDefault()
          }}
          onDismiss={() => {
            setNoBackdropLog(l => [...l, 'dismiss'])
            setOpenNoBackdrop(false)
          }}
        >
          {/* No Backdrop part authored */}
          <Overlay.Content
            data-testid="content-no-backdrop"
            style={{
              position: 'fixed',
              top: 80,
              left: 80,
              width: 220,
              height: 120,
              background: '#fef3c7',
              padding: 16,
              zIndex: 1001,
            }}
          >
            <p>No Backdrop Content</p>
          </Overlay.Content>
        </Overlay>
      </section>

      <hr style={{ margin: '32px 0' }} />

      {/* OV-OUT-06: Touch delayed dismissal */}
      <section data-testid="section-ov-out-06">
        <h3>OV-OUT-06: Touch Delayed Dismissal</h3>
        <button
          type="button"
          data-testid="btn-open-touch"
          onClick={() => {
            setTouchLog(['open'])
            setOpenTouch(true)
          }}
        >
          Open Touch Test
        </button>
        <pre data-testid="touch-events-log">{touchLog.join(',')}</pre>

        <Overlay
          open={openTouch}
          onOpenChange={setOpenTouch}
          onOutsidePress={() => setTouchLog(l => [...l, 'outside'])}
          onDismiss={() => {
            setTouchLog(l => [...l, 'dismiss'])
            setOpenTouch(false)
          }}
        >
          <Overlay.Backdrop
            data-testid="touch-backdrop"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000 }}
          />
          <Overlay.Content
            data-testid="touch-content"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: '#fff',
              padding: 24,
              zIndex: 1001,
            }}
          >
            <p>Touch Overlay Content</p>
            <button
              type="button"
              data-testid="btn-touch-inside"
              onPointerDown={() => setTouchLog(l => [...l, 'touch:inside'])}
            >
              Touch Inside
            </button>
          </Overlay.Content>
        </Overlay>
      </section>

      <hr style={{ margin: '32px 0' }} />

      {/* OV-FOCUS-09: Focus is not dismiss */}
      <section data-testid="section-ov-focus-09">
        <h3>OV-FOCUS-09: Focus Movement is not Dismiss</h3>
        <button
          type="button"
          data-testid="btn-open-focus-move"
          onClick={() => {
            setFocusMoveLog(['open'])
            setOpenFocusMove(true)
          }}
        >
          Open Focus Move Test
        </button>
        <button
          type="button"
          data-testid="btn-focus-move-outside"
          style={{ marginLeft: 12 }}
          onClick={() => setFocusMoveLog(l => [...l, 'outside-btn-clicked'])}
        >
          Outside Focus Target
        </button>
        <pre data-testid="focus-move-log">{focusMoveLog.join(',')}</pre>

        <Overlay
          open={openFocusMove}
          onOpenChange={setOpenFocusMove}
          onOutsidePress={() => setFocusMoveLog(l => [...l, 'outside'])}
          onDismiss={() => {
            setFocusMoveLog(l => [...l, 'dismiss'])
            setOpenFocusMove(false)
          }}
        >
          <Overlay.Content
            data-testid="focus-move-content"
            initialFocus={false}
            style={{
              position: 'fixed',
              top: '40%',
              left: '40%',
              background: '#fff',
              padding: 20,
              zIndex: 1001,
            }}
          >
            <p>Focus Move Content</p>
            <button type="button" data-testid="btn-focus-move-inner">
              Inner Button
            </button>
          </Overlay.Content>
        </Overlay>
      </section>

      <hr style={{ margin: '32px 0' }} />

      {/* OV-ISO-04: Defer only when inert */}
      <section data-testid="section-ov-iso-04">
        <h3>OV-ISO-04: Outside Press Deferral (Inert vs Non-Inert)</h3>
        <button
          type="button"
          data-testid="btn-open-iso-true"
          onClick={() => {
            setIsoLog(['open:true'])
            setOpenIsoTrue(true)
          }}
        >
          Open Iso True (Inert)
        </button>
        <button
          type="button"
          data-testid="btn-open-iso-false"
          style={{ marginLeft: 12 }}
          onClick={() => {
            setIsoLog(['open:false'])
            setOpenIsoFalse(true)
          }}
        >
          Open Iso False (Non-Inert)
        </button>
        <pre data-testid="iso-events-log">{isoLog.join(',')}</pre>

        {/* Modal without Backdrop */}
        <Overlay
          open={openIsoTrue}
          isolation={true}
          onOpenChange={setOpenIsoTrue}
          onOutsidePress={() => setIsoLog(l => [...l, 'outside:true'])}
          onDismiss={() => {
            setIsoLog(l => [...l, 'dismiss:true'])
            setOpenIsoTrue(false)
          }}
        >
          <Overlay.Content
            data-testid="content-iso-true"
            style={{
              position: 'fixed',
              top: 60,
              left: 60,
              width: 180,
              height: 90,
              background: '#e0f2fe',
              padding: 12,
              zIndex: 1001,
            }}
          >
            <p>Iso True</p>
          </Overlay.Content>
        </Overlay>

        {/* Modeless without Backdrop */}
        <Overlay
          open={openIsoFalse}
          isolation={false}
          onOpenChange={setOpenIsoFalse}
          onOutsidePress={() => setIsoLog(l => [...l, 'outside:false'])}
          onDismiss={() => {
            setIsoLog(l => [...l, 'dismiss:false'])
            setOpenIsoFalse(false)
          }}
        >
          <Overlay.Content
            data-testid="content-iso-false"
            style={{
              position: 'fixed',
              top: 60,
              left: 60,
              width: 180,
              height: 90,
              background: '#fce7f3',
              padding: 12,
              zIndex: 1001,
            }}
          >
            <p>Iso False</p>
          </Overlay.Content>
        </Overlay>
      </section>
    </div>
  )
}
