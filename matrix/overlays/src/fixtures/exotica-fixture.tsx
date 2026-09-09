import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { Overlay } from '@reference-ui/lib'

function MiniRootOverlay({
  id,
  open,
  onEscape,
  onDismiss,
}: {
  id: string
  open: boolean
  onEscape: () => void
  onDismiss: () => void
}) {
  return (
    <Overlay
      open={open}
      onEscape={onEscape}
      onOutsidePress={() => {}}
      onDismiss={onDismiss}
    >
      <Overlay.Backdrop
        data-testid={`${id}-backdrop`}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 1000 }}
      />
      <Overlay.Content
        data-testid={`${id}-content`}
        role="dialog"
        style={{
          position: 'fixed',
          top: id === 'root-a' ? '15%' : '45%',
          left: '20%',
          background: '#fff',
          padding: 16,
          zIndex: 1001,
        }}
      >
        <p>{id}</p>
        <button type="button" data-testid={`${id}-inner`}>
          Inner {id}
        </button>
        <button type="button" data-testid={`${id}-close`} onClick={onDismiss}>
          Close
        </button>
      </Overlay.Content>
    </Overlay>
  )
}

export function ExoticaFixture() {
  const [dom03Open, setDom03Open] = React.useState(false)

  const [out10Open, setOut10Open] = React.useState(false)
  const [out10Log, setOut10Log] = React.useState<string[]>([])

  const [restore08Open, setRestore08Open] = React.useState(false)
  const restoreTargetRef = React.useRef<'a' | 'b'>('a')
  const restoreARef = React.useRef<HTMLButtonElement | null>(null)
  const restoreBRef = React.useRef<HTMLButtonElement | null>(null)

  const [layer09Parent, setLayer09Parent] = React.useState(false)
  const [layer09Child, setLayer09Child] = React.useState(false)
  const [layer09Host, setLayer09Host] = React.useState<'a' | 'b'>('a')
  const [layer09Log, setLayer09Log] = React.useState<string[]>([])
  const layer09ARef = React.useRef<HTMLDivElement | null>(null)
  const layer09BRef = React.useRef<HTMLDivElement | null>(null)
  const [layer09PortalsReady, setLayer09PortalsReady] = React.useState(false)

  const [inert06Open, setInert06Open] = React.useState(false)
  const nestedShadowHostRef = React.useRef<HTMLDivElement | null>(null)
  const [nestedShadowDest, setNestedShadowDest] = React.useState<HTMLElement | null>(null)

  const [inert08Open, setInert08Open] = React.useState(false)

  const [inert09Open, setInert09Open] = React.useState(false)
  const [inert09Mutations, setInert09Mutations] = React.useState(0)

  const [inert10Open, setInert10Open] = React.useState(false)
  const inert10OutsideRef = React.useRef<HTMLDivElement | null>(null)
  const inert10HiddenRef = React.useRef<HTMLDivElement | null>(null)

  const [scroll06Open, setScroll06Open] = React.useState(false)

  const [scroll08Open, setScroll08Open] = React.useState(false)

  const [scroll09Open, setScroll09Open] = React.useState(false)
  const scroll09HostRef = React.useRef<HTMLDivElement | null>(null)
  const [scroll09Dest, setScroll09Dest] = React.useState<HTMLElement | null>(null)

  const [env03Open, setEnv03Open] = React.useState(false)
  const env03HostRef = React.useRef<HTMLDivElement | null>(null)
  const [env03Dest, setEnv03Dest] = React.useState<HTMLElement | null>(null)

  const [pos10Open, setPos10Open] = React.useState(false)
  const pos10AnchorRef = React.useRef<HTMLButtonElement | null>(null)
  const pos10RtlRef = React.useRef<HTMLDivElement | null>(null)
  const [pos10Ready, setPos10Ready] = React.useState(false)

  const [pos12Open, setPos12Open] = React.useState(false)
  const pos12HostRef = React.useRef<HTMLDivElement | null>(null)
  const pos12AnchorRef = React.useRef<HTMLButtonElement | null>(null)
  const [pos12Dest, setPos12Dest] = React.useState<HTMLElement | null>(null)

  const [edge05Open, setEdge05Open] = React.useState(false)

  const [mainEscOpen, setMainEscOpen] = React.useState(false)
  const [mainEscLog, setMainEscLog] = React.useState<string[]>([])

  const [openA, setOpenA] = React.useState(false)
  const [openB, setOpenB] = React.useState(false)
  const [rootsLog, setRootsLog] = React.useState<string[]>([])
  const hostARef = React.useRef<HTMLDivElement | null>(null)
  const hostBRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    const a = document.createElement('div')
    a.setAttribute('data-testid', 'layer-09-host-a')
    a.setAttribute('data-reference-portal-container', '')
    const b = document.createElement('div')
    b.setAttribute('data-testid', 'layer-09-host-b')
    b.setAttribute('data-reference-portal-container', '')
    document.body.append(a, b)
    layer09ARef.current = a
    layer09BRef.current = b
    setLayer09PortalsReady(true)
    setPos10Ready(true)
    ;(window as unknown as { __ovRestore08?: (v: 'a' | 'b') => void }).__ovRestore08 = v => {
      restoreTargetRef.current = v
    }
    return () => {
      a.remove()
      b.remove()
      layer09ARef.current = null
      layer09BRef.current = null
    }
  }, [])

  React.useEffect(() => {
    const host = nestedShadowHostRef.current
    if (!host || host.shadowRoot) return
    const outer = host.attachShadow({ mode: 'open' })
    const outerSibling = document.createElement('button')
    outerSibling.type = 'button'
    outerSibling.setAttribute('data-testid', 'outer-shadow-sibling')
    outerSibling.textContent = 'Outer shadow sibling'
    const innerHost = document.createElement('div')
    innerHost.setAttribute('data-testid', 'inner-shadow-host')
    outer.append(outerSibling, innerHost)
    const inner = innerHost.attachShadow({ mode: 'open' })
    const innerSibling = document.createElement('button')
    innerSibling.type = 'button'
    innerSibling.setAttribute('data-testid', 'inner-shadow-sibling')
    innerSibling.textContent = 'Inner shadow sibling'
    const dest = document.createElement('div')
    dest.setAttribute('data-testid', 'inner-shadow-portal')
    inner.append(innerSibling, dest)
    setNestedShadowDest(dest)
  }, [])

  React.useEffect(() => {
    const host = env03HostRef.current
    if (!host || host.shadowRoot) return
    const shadow = host.attachShadow({ mode: 'open' })
    const dest = document.createElement('div')
    dest.setAttribute('data-testid', 'env03-shadow-dest')
    shadow.appendChild(dest)
    setEnv03Dest(dest)
  }, [])

  React.useEffect(() => {
    const host = scroll09HostRef.current
    if (!host || host.shadowRoot) return
    const shadow = host.attachShadow({ mode: 'open' })

    const bgScroll = document.createElement('div')
    bgScroll.setAttribute('data-testid', 'scroll09-bg')
    bgScroll.style.cssText = 'height:80px;overflow:auto;border:1px solid #ccc'
    const bgInner = document.createElement('div')
    bgInner.style.height = '240px'
    bgInner.textContent = 'background scroller'
    bgScroll.appendChild(bgInner)

    const dest = document.createElement('div')
    dest.setAttribute('data-testid', 'scroll09-dest')
    shadow.append(bgScroll, dest)
    setScroll09Dest(dest)
  }, [])

  React.useEffect(() => {
    const host = pos12HostRef.current
    if (!host || host.shadowRoot) return
    const shadow = host.attachShadow({ mode: 'open' })
    const scroller = document.createElement('div')
    scroller.setAttribute('data-testid', 'pos12-scroller')
    scroller.style.cssText = 'height:120px;overflow:auto;border:1px solid #999'
    const pad = document.createElement('div')
    pad.style.height = '80px'
    const dest = document.createElement('div')
    dest.setAttribute('data-testid', 'pos12-dest')
    const tail = document.createElement('div')
    tail.style.height = '160px'
    scroller.append(pad, dest, tail)
    shadow.appendChild(scroller)
    setPos12Dest(dest)
  }, [])

  React.useEffect(() => {
    if (!hostARef.current || !hostBRef.current) return
    const a = createRoot(hostARef.current)
    const b = createRoot(hostBRef.current)
    a.render(
      <MiniRootOverlay
        id="root-a"
        open={openA}
        onEscape={() => setRootsLog(l => [...l, 'a-escape'])}
        onDismiss={() => {
          setRootsLog(l => [...l, 'a-dismiss'])
          setOpenA(false)
        }}
      />
    )
    b.render(
      <MiniRootOverlay
        id="root-b"
        open={openB}
        onEscape={() => setRootsLog(l => [...l, 'b-escape'])}
        onDismiss={() => {
          setRootsLog(l => [...l, 'b-dismiss'])
          setOpenB(false)
        }}
      />
    )
    return () => {
      a.unmount()
      b.unmount()
    }
  }, [openA, openB])

  const layer09Container =
    layer09Host === 'a' ? layer09ARef.current : layer09BRef.current

  return (
    <div data-testid="exotica-fixture-root" style={{ padding: 16 }}>
      <h2>Overlay Exotica</h2>

      <section data-testid="section-iframe" style={{ marginBottom: 24 }}>
        <h3>Iframe stack</h3>
        <button
          type="button"
          data-testid="btn-main-esc-open"
          onClick={() => {
            setMainEscLog(['open'])
            setMainEscOpen(true)
          }}
        >
          Open Main Overlay
        </button>
        <pre data-testid="main-esc-log">{mainEscLog.join(',')}</pre>
        <Overlay
          open={mainEscOpen}
          onOpenChange={setMainEscOpen}
          onEscape={() => setMainEscLog(l => [...l, 'escape'])}
          onDismiss={() => {
            setMainEscLog(l => [...l, 'dismiss'])
            setMainEscOpen(false)
          }}
        >
          <Overlay.Backdrop
            data-testid="main-esc-backdrop"
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 1000 }}
          />
          <Overlay.Content
            data-testid="main-esc-content"
            style={{
              position: 'fixed',
              top: '10%',
              left: '10%',
              background: '#fff',
              padding: 16,
              zIndex: 1001,
            }}
          >
            <button type="button" data-testid="btn-main-esc-inner">
              Main inner
            </button>
            <button type="button" data-testid="btn-main-esc-close" onClick={() => setMainEscOpen(false)}>
              Close
            </button>
          </Overlay.Content>
        </Overlay>
        <iframe
          data-testid="exotica-iframe"
          title="overlay-frame"
          src="/overlay/frame"
          style={{ width: 360, height: 200, border: '1px solid #ccc' }}
        />
      </section>

      <section data-testid="section-two-roots" style={{ marginBottom: 24 }}>
        <h3>Two React roots</h3>
        <button
          type="button"
          data-testid="btn-open-root-a"
          data-reference-overlay-ignore=""
          style={{ pointerEvents: 'auto', position: 'relative', zIndex: 20000 }}
          onClick={() => setOpenA(true)}
        >
          Open A
        </button>
        <button
          type="button"
          data-testid="btn-open-root-b"
          data-reference-overlay-ignore=""
          style={{ pointerEvents: 'auto', position: 'relative', zIndex: 20000 }}
          onClick={() => setOpenB(true)}
        >
          Open B
        </button>
        <pre data-testid="roots-log">{rootsLog.join(',')}</pre>
        <div ref={hostARef} data-testid="two-root-host-a" />
        <div ref={hostBRef} data-testid="two-root-host-b" />
      </section>

      <section data-testid="section-ov-dom-03" style={{ marginBottom: 24 }}>
        <h3>OV-DOM-03 StyleProps</h3>
        <button type="button" data-testid="btn-open-dom-03" onClick={() => setDom03Open(true)}>
          Open DOM-03
        </button>
        <Overlay open={dom03Open} onOpenChange={setDom03Open}>
          <Overlay.Backdrop
            data-testid="dom-03-backdrop"
            bg="black"
            style={{ position: 'fixed', inset: 0, opacity: 0.35, zIndex: 1000 }}
          />
          <Overlay.Content
            data-testid="dom-03-content"
            bg="ui.dialog.background"
            color="ui.dialog.foreground"
            p="4"
            style={{
              position: 'fixed',
              top: '25%',
              left: '25%',
              zIndex: 1001,
            }}
          >
            <p>Styled dialog</p>
            <button type="button" data-testid="btn-close-dom-03" onClick={() => setDom03Open(false)}>
              Close
            </button>
          </Overlay.Content>
        </Overlay>
      </section>

      <section data-testid="section-ov-out-10" style={{ marginBottom: 24 }}>
        <h3>OV-OUT-10 deferred stopped + focus</h3>
        <button
          type="button"
          data-testid="btn-open-out-10"
          onClick={() => {
            setOut10Log(['open'])
            setOut10Open(true)
          }}
        >
          Open OUT-10
        </button>
        <pre data-testid="out-10-log">{out10Log.join(',')}</pre>
        <Overlay
          open={out10Open}
          onOpenChange={setOut10Open}
          onOutsidePress={() => setOut10Log(l => [...l, 'outside'])}
          onDismiss={() => {
            setOut10Log(l => [...l, 'dismiss'])
            setOut10Open(false)
          }}
        >
          <Overlay.Backdrop
            data-testid="out-10-backdrop"
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1000 }}
          />
          <Overlay.Content
            data-testid="out-10-content"
            style={{
              position: 'fixed',
              top: '30%',
              left: '30%',
              background: '#fff',
              padding: 16,
              zIndex: 1001,
            }}
          >
            <button type="button" data-testid="btn-out-10-inner">
              Inner
            </button>
          </Overlay.Content>
        </Overlay>
        <div
          data-testid="out-10-extension"
          onMouseDown={e => e.stopPropagation()}
          onMouseUp={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
          style={{ padding: 8, border: '1px dashed #999', display: 'inline-block' }}
        >
          <button
            type="button"
            data-testid="btn-out-10-extension"
            onMouseDown={e => e.stopPropagation()}
            onMouseUp={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
          >
            Extension focus
          </button>
        </div>
      </section>

      <section data-testid="section-ov-restore-08" style={{ marginBottom: 24 }}>
        <h3>OV-RESTORE-08 resolver during exit</h3>
        <button
          type="button"
          ref={restoreARef}
          data-testid="btn-restore-08-a"
          data-reference-overlay-ignore=""
        >
          Restore A
        </button>
        <button
          type="button"
          ref={restoreBRef}
          data-testid="btn-restore-08-b"
          data-reference-overlay-ignore=""
        >
          Restore B
        </button>
        <button
          type="button"
          data-testid="btn-restore-08-switch"
          data-reference-overlay-ignore=""
          style={{ pointerEvents: 'auto', position: 'relative', zIndex: 20000 }}
          onClick={() => {
            restoreTargetRef.current = 'b'
          }}
        >
          Switch to B
        </button>
        <button
          type="button"
          data-testid="btn-open-restore-08"
          onClick={() => {
            restoreTargetRef.current = 'a'
            setRestore08Open(true)
          }}
        >
          Open Restore-08
        </button>
        <Overlay open={restore08Open} onOpenChange={setRestore08Open}>
          <Overlay.Backdrop
            data-testid="restore-08-backdrop"
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.3)',
              transition: 'opacity 200ms linear',
              opacity: restore08Open ? 1 : 0,
              zIndex: 1000,
            }}
          />
          <Overlay.Content
            data-testid="restore-08-content"
            restoreFocus={() =>
              restoreTargetRef.current === 'b' ? restoreBRef.current : restoreARef.current
            }
            style={{
              position: 'fixed',
              top: '20%',
              left: '20%',
              background: '#fff',
              padding: 16,
              transition: 'opacity 200ms linear',
              opacity: restore08Open ? 1 : 0,
              zIndex: 1001,
            }}
          >
            <button
              type="button"
              data-testid="btn-close-restore-08"
              onClick={() => setRestore08Open(false)}
            >
              Close
            </button>
          </Overlay.Content>
        </Overlay>
      </section>

      <section data-testid="section-ov-layer-09" style={{ marginBottom: 24 }}>
        <h3>OV-LAYER-09 branch reparent</h3>
        <button type="button" data-testid="btn-layer-09-parent" onClick={() => setLayer09Parent(true)}>
          Open parent
        </button>
        <button
          type="button"
          data-testid="btn-layer-09-mount-child"
          data-reference-overlay-ignore=""
          style={{ pointerEvents: 'auto', position: 'relative', zIndex: 20000 }}
          onClick={() => setLayer09Child(true)}
        >
          Mount child
        </button>
        <button
          type="button"
          data-testid="btn-layer-09-reparent"
          data-reference-overlay-ignore=""
          style={{ pointerEvents: 'auto', position: 'relative', zIndex: 20000 }}
          onClick={() => setLayer09Host(h => (h === 'a' ? 'b' : 'a'))}
        >
          Reparent child
        </button>
        <button
          type="button"
          data-testid="btn-layer-09-unmount-child"
          data-reference-overlay-ignore=""
          style={{ pointerEvents: 'auto', position: 'relative', zIndex: 20000 }}
          onClick={() => setLayer09Child(false)}
        >
          Unmount child
        </button>
        <pre data-testid="layer-09-log">{layer09Log.join(',')}</pre>
        <div data-testid="layer-09-host-a-slot" />
        <div data-testid="layer-09-host-b-slot" />
        <Overlay
          open={layer09Parent}
          onOpenChange={setLayer09Parent}
          onOutsidePress={() => setLayer09Log(l => [...l, 'parent-outside'])}
          onDismiss={() => {
            setLayer09Log(l => [...l, 'parent-dismiss'])
            setLayer09Parent(false)
          }}
        >
          <Overlay.Backdrop
            data-testid="layer-09-parent-backdrop"
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 1000 }}
          />
          <Overlay.Content
            data-testid="layer-09-parent-content"
            style={{
              position: 'fixed',
              top: '20%',
              left: '15%',
              background: '#fff',
              padding: 16,
              zIndex: 1001,
            }}
          >
            <p>Parent</p>
            <button type="button" data-testid="btn-layer-09-parent-inner">
              Parent inner
            </button>
          </Overlay.Content>
          {layer09Child && layer09PortalsReady && layer09Container && (
            <Overlay
              open={layer09Child}
              onOpenChange={setLayer09Child}
              isolation={false}
              onOutsidePress={() => setLayer09Log(l => [...l, 'child-outside'])}
              onDismiss={() => {
                setLayer09Log(l => [...l, 'child-dismiss'])
                setLayer09Child(false)
              }}
            >
              <Overlay.Portal container={layer09Container}>
                <Overlay.Content
                  data-testid="layer-09-child-content"
                  style={{
                    position: 'fixed',
                    top: '40%',
                    left: '35%',
                    background: '#eef',
                    padding: 12,
                    zIndex: 1100,
                  }}
                >
                  <button type="button" data-testid="btn-layer-09-child-inner">
                    Child inner
                  </button>
                </Overlay.Content>
              </Overlay.Portal>
            </Overlay>
          )}
        </Overlay>
      </section>

      <section data-testid="section-ov-inert-06" style={{ marginBottom: 24 }}>
        <h3>OV-INERT-06 nested shadow</h3>
        <button type="button" data-testid="btn-light-sibling">
          Light sibling
        </button>
        <div ref={nestedShadowHostRef} data-testid="nested-shadow-host" />
        <button type="button" data-testid="btn-open-inert-06" onClick={() => setInert06Open(true)}>
          Open INERT-06
        </button>
        {nestedShadowDest && (
          <Overlay open={inert06Open} onOpenChange={setInert06Open}>
            <Overlay.Portal container={nestedShadowDest}>
              <Overlay.Content
                data-testid="inert-06-content"
                role="dialog"
                style={{ background: '#fff', padding: 16 }}
              >
                <button type="button" data-testid="btn-inert-06-inner">
                  Inner
                </button>
                <button type="button" data-testid="btn-close-inert-06" onClick={() => setInert06Open(false)}>
                  Close
                </button>
              </Overlay.Content>
            </Overlay.Portal>
          </Overlay>
        )}
      </section>

      <section data-testid="section-ov-inert-08" style={{ marginBottom: 24 }}>
        <h3>OV-INERT-08 a11y snapshot</h3>
        <button type="button" data-testid="btn-inert-08-bg">
          Background control
        </button>
        <button type="button" data-testid="btn-open-inert-08" onClick={() => setInert08Open(true)}>
          Open INERT-08
        </button>
        <Overlay open={inert08Open} onOpenChange={setInert08Open}>
          <Overlay.Backdrop
            data-testid="inert-08-backdrop"
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1000 }}
          />
          <Overlay.Content
            data-testid="inert-08-content"
            role="dialog"
            aria-labelledby="inert-08-title"
            style={{
              position: 'fixed',
              top: '25%',
              left: '25%',
              background: '#fff',
              padding: 16,
              zIndex: 1001,
            }}
          >
            <h2 id="inert-08-title">Accessible dialog</h2>
            <button type="button" data-testid="btn-inert-08-inner">
              Dialog action
            </button>
            <button type="button" data-testid="btn-close-inert-08" onClick={() => setInert08Open(false)}>
              Close
            </button>
          </Overlay.Content>
        </Overlay>
      </section>

      <section data-testid="section-ov-inert-09" style={{ marginBottom: 24 }}>
        <h3>OV-INERT-09 already hidden ancestor</h3>
        <div
          data-testid="inert-09-hidden"
          aria-hidden="true"
          style={{ padding: 8, border: '1px solid #ccc' }}
        >
          <button type="button" data-testid="btn-inert-09-desc">
            Hidden descendant
          </button>
        </div>
        <button type="button" data-testid="btn-inert-09-ordinary">
          Ordinary sibling
        </button>
        <button
          type="button"
          data-testid="btn-open-inert-09"
          onClick={() => {
            setInert09Mutations(0)
            setInert09Open(true)
          }}
        >
          Open INERT-09
        </button>
        <pre data-testid="inert-09-mutations">{String(inert09Mutations)}</pre>
        <Overlay open={inert09Open} onOpenChange={setInert09Open}>
          <Overlay.Backdrop
            data-testid="inert-09-backdrop"
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1000 }}
          />
          <Overlay.Content
            data-testid="inert-09-content"
            style={{
              position: 'fixed',
              top: '30%',
              left: '30%',
              background: '#fff',
              padding: 16,
              zIndex: 1001,
            }}
          >
            <button type="button" data-testid="btn-close-inert-09" onClick={() => setInert09Open(false)}>
              Close
            </button>
          </Overlay.Content>
        </Overlay>
      </section>

      <section data-testid="section-ov-inert-10" style={{ marginBottom: 24 }}>
        <h3>OV-INERT-10 reparent into hidden</h3>
        <div ref={inert10OutsideRef} data-testid="inert-10-outside-host" />
        <div
          ref={inert10HiddenRef}
          data-testid="inert-10-hidden"
          aria-hidden="true"
          style={{ padding: 8 }}
        >
          Pre-hidden
        </div>
        <button type="button" data-testid="btn-open-inert-10" onClick={() => setInert10Open(true)}>
          Open INERT-10
        </button>
        <Overlay open={inert10Open} onOpenChange={setInert10Open}>
          <Overlay.Backdrop
            data-testid="inert-10-backdrop"
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1000 }}
          />
          <Overlay.Content
            data-testid="inert-10-content"
            style={{
              position: 'fixed',
              top: '30%',
              left: '30%',
              background: '#fff',
              padding: 16,
              zIndex: 1001,
            }}
          >
            <button type="button" data-testid="btn-close-inert-10" onClick={() => setInert10Open(false)}>
              Close
            </button>
          </Overlay.Content>
        </Overlay>
      </section>

      <section data-testid="section-ov-scroll-06" style={{ marginBottom: 24 }}>
        <h3>OV-SCROLL-06 pinch zoom</h3>
        <button type="button" data-testid="btn-open-scroll-06" onClick={() => setScroll06Open(true)}>
          Open SCROLL-06
        </button>
        <Overlay open={scroll06Open} onOpenChange={setScroll06Open}>
          <Overlay.Backdrop
            data-testid="scroll-06-backdrop"
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1000 }}
          />
          <Overlay.Content
            data-testid="scroll-06-content"
            style={{
              position: 'fixed',
              top: '30%',
              left: '30%',
              background: '#fff',
              padding: 16,
              zIndex: 1001,
            }}
          >
            <button type="button" data-testid="btn-close-scroll-06" onClick={() => setScroll06Open(false)}>
              Close
            </button>
          </Overlay.Content>
        </Overlay>
      </section>

      <section data-testid="section-ov-scroll-08" style={{ marginBottom: 24 }}>
        <h3>OV-SCROLL-08 RTL gutter</h3>
        <button type="button" data-testid="btn-open-scroll-08" onClick={() => setScroll08Open(true)}>
          Open SCROLL-08
        </button>
        <Overlay open={scroll08Open} onOpenChange={setScroll08Open}>
          <Overlay.Backdrop
            data-testid="scroll-08-backdrop"
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1000 }}
          />
          <Overlay.Content
            data-testid="scroll-08-content"
            style={{
              position: 'fixed',
              top: '30%',
              left: '30%',
              background: '#fff',
              padding: 16,
              zIndex: 1001,
            }}
          >
            <button type="button" data-testid="btn-close-scroll-08" onClick={() => setScroll08Open(false)}>
              Close
            </button>
          </Overlay.Content>
        </Overlay>
      </section>

      <section data-testid="section-ov-scroll-09" style={{ marginBottom: 24 }}>
        <h3>OV-SCROLL-09 shadow scroll</h3>
        <div ref={scroll09HostRef} data-testid="scroll09-host" />
        <button type="button" data-testid="btn-open-scroll-09" onClick={() => setScroll09Open(true)}>
          Open SCROLL-09
        </button>
        {scroll09Dest && (
          <Overlay open={scroll09Open} onOpenChange={setScroll09Open}>
            <Overlay.Portal container={scroll09Dest}>
              <Overlay.Content
                data-testid="scroll-09-content"
                style={{ background: '#fff', padding: 8, maxHeight: 80, overflow: 'auto' }}
              >
                <div data-testid="scroll-09-inner" style={{ height: 240 }}>
                  Inner scroller
                </div>
              </Overlay.Content>
            </Overlay.Portal>
          </Overlay>
        )}
      </section>

      <section data-testid="section-ov-env-03" style={{ marginBottom: 24 }}>
        <h3>OV-ENV-03 shadow portal contract</h3>
        <button type="button" data-testid="btn-env-03-bg">
          Env03 background
        </button>
        <div ref={env03HostRef} data-testid="env03-host" />
        <button type="button" data-testid="btn-open-env-03" onClick={() => setEnv03Open(true)}>
          Open ENV-03
        </button>
        {env03Dest && (
          <Overlay open={env03Open} onOpenChange={setEnv03Open}>
            <Overlay.Portal container={env03Dest}>
              <Overlay.Backdrop
                data-testid="env-03-backdrop"
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1000 }}
              />
              <Overlay.Content
                data-testid="env-03-content"
                role="dialog"
                style={{
                  position: 'fixed',
                  top: '30%',
                  left: '30%',
                  background: '#fff',
                  padding: 16,
                  zIndex: 1001,
                }}
              >
                <button type="button" data-testid="btn-env-03-inner">
                  Inner
                </button>
                <button type="button" data-testid="btn-close-env-03" onClick={() => setEnv03Open(false)}>
                  Close
                </button>
              </Overlay.Content>
            </Overlay.Portal>
          </Overlay>
        )}
      </section>

      <section data-testid="section-ov-pos-10" style={{ marginBottom: 24 }}>
        <h3>OV-POS-10 RTL placement</h3>
        <div
          ref={pos10RtlRef}
          dir="rtl"
          data-testid="pos-10-rtl"
          style={{ padding: 24, border: '1px solid #ddd' }}
        >
          <button
            type="button"
            ref={pos10AnchorRef}
            data-testid="btn-pos-10-anchor"
            style={{ width: 120, height: 40 }}
            onClick={() => setPos10Open(true)}
          >
            Anchor
          </button>
          {pos10Ready && pos10RtlRef.current && (
            <Overlay
              open={pos10Open}
              onOpenChange={setPos10Open}
              anchor={pos10AnchorRef}
              isolation={false}
            >
              <Overlay.Portal container={pos10RtlRef.current}>
                <Overlay.Content
                  data-testid="pos-10-content"
                  placement="bottom-start"
                  style={{ width: 80, height: 40, background: '#e0e7ff' }}
                >
                  RTL
                </Overlay.Content>
              </Overlay.Portal>
            </Overlay>
          )}
        </div>
      </section>

      <section data-testid="section-ov-pos-12" style={{ marginBottom: 24 }}>
        <h3>OV-POS-12 shadow position</h3>
        <button
          type="button"
          ref={pos12AnchorRef}
          data-testid="btn-pos-12-anchor"
          onClick={() => setPos12Open(true)}
        >
          Shadow anchor
        </button>
        <div ref={pos12HostRef} data-testid="pos12-host" />
        {pos12Dest && (
          <Overlay
            open={pos12Open}
            onOpenChange={setPos12Open}
            anchor={pos12AnchorRef}
            isolation={false}
          >
            <Overlay.Portal container={pos12Dest}>
              <Overlay.Content
                data-testid="pos-12-content"
                style={{ width: 100, height: 40, background: '#fde68a' }}
              >
                Shadow pos
              </Overlay.Content>
            </Overlay.Portal>
          </Overlay>
        )}
      </section>

      <section data-testid="section-ov-edge-05" style={{ marginBottom: 24 }}>
        <h3>OV-EDGE-05 physical left in RTL</h3>
        <button type="button" data-testid="btn-open-edge-05" onClick={() => setEdge05Open(true)}>
          Open EDGE-05
        </button>
        <Overlay open={edge05Open} onOpenChange={setEdge05Open} edge="left">
          <Overlay.Content
            data-testid="edge-05-content"
            offset={0}
            style={{ background: '#fff', padding: 16, width: 200 }}
          >
            <button type="button" data-testid="btn-close-edge-05" onClick={() => setEdge05Open(false)}>
              Close
            </button>
          </Overlay.Content>
        </Overlay>
      </section>
    </div>
  )
}
