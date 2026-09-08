import * as React from 'react'
import { Overlay } from '@reference-ui/lib'

export function DialogFixture() {
  const [open, setOpen] = React.useState(false)
  const [unboundOpen, setUnboundOpen] = React.useState(false)
  const [controlledOpen, setControlledOpen] = React.useState(false)
  const [rejectOpen, setRejectOpen] = React.useState(false)
  const [escapeLog, setEscapeLog] = React.useState<string[]>([])
  const [rejectLog, setRejectLog] = React.useState<string[]>([])
  const [outsideClicks, setOutsideClicks] = React.useState(0)
  const [dupBackdropOpen, setDupBackdropOpen] = React.useState(false)
  const [dupContentOpen, setDupContentOpen] = React.useState(false)
  const [dupTriggerOpen, setDupTriggerOpen] = React.useState(false)
  const [dupHandleOpen, setDupHandleOpen] = React.useState(false)
  const [noEdgeHandleOpen, setNoEdgeHandleOpen] = React.useState(false)
  const [missingContentOpen, setMissingContentOpen] = React.useState(false)
  const [mixedGeometryOpen, setMixedGeometryOpen] = React.useState(false)
  const [consoleErrors, setConsoleErrors] = React.useState<string[]>([])

  const [rerenderEscapeOpen, setRerenderEscapeOpen] = React.useState(false)
  const [escapeBlockCount, setEscapeBlockCount] = React.useState(0)
  const [escapeRerenderLog, setEscapeRerenderLog] = React.useState<string[]>([])

  const [alertDialogOpen, setAlertDialogOpen] = React.useState(false)
  const [alertDialogLog, setAlertDialogLog] = React.useState<string[]>([])

  const [presEqualOpen, setPresEqualOpen] = React.useState(false)
  const [presBackdropSlowerOpen, setPresBackdropSlowerOpen] = React.useState(false)
  const [presContentSlowerOpen, setPresContentSlowerOpen] = React.useState(false)
  const [presNoMotionOpen, setPresNoMotionOpen] = React.useState(false)
  const [presChildAnimOpen, setPresChildAnimOpen] = React.useState(false)

  // 9. Modal Pointer Isolation (OV-POINTER-01, 03, 04, 05, 06)
  const [pointerIsoOpen, setPointerIsoOpen] = React.useState(false)
  const [pointerIsoBgClicks, setPointerIsoBgClicks] = React.useState(0)
  const [pointerIsoBgVal, setPointerIsoBgVal] = React.useState('')
  const [pointerIsoInsideClicks, setPointerIsoInsideClicks] = React.useState(0)

  const [nestedModalAOpen, setNestedModalAOpen] = React.useState(false)
  const [nestedModalBOpen, setNestedModalBOpen] = React.useState(false)
  const [nestedModalBgClicks, setNestedModalBgClicks] = React.useState(0)

  const [overlapLowerOpen, setOverlapLowerOpen] = React.useState(false)
  const [overlapTopOpen, setOverlapTopOpen] = React.useState(false)
  const [overlapLowerClicks, setOverlapLowerClicks] = React.useState(0)
  const [overlapTopClicks, setOverlapTopClicks] = React.useState(0)

  const [pointerExitOpen, setPointerExitOpen] = React.useState(false)
  const [pointerExitBgClicks, setPointerExitBgClicks] = React.useState(0)

  const [reopenPointerOpen, setReopenPointerOpen] = React.useState(false)
  const [reopenPointerBgClicks, setReopenPointerBgClicks] = React.useState(0)

  // Step 3: Trigger interaction (OV-TRG-03, OV-TRG-04, OV-TRG-05)
  const [trg03Open, setTrg03Open] = React.useState(false)
  const [trg03PreventedOpen, setTrg03PreventedOpen] = React.useState(false)
  const [trg03DisabledOpen, setTrg03DisabledOpen] = React.useState(false)
  const [trg03Log, setTrg03Log] = React.useState<string[]>([])

  const [trg04Open, setTrg04Open] = React.useState(false)

  const [trg05Open, setTrg05Open] = React.useState(false)
  const [trg05DismissCount, setTrg05DismissCount] = React.useState(0)

  // Step 7: OV-DOM-04, OV-EDGE-02, OV-INERT-02
  const [customPortalOpen, setCustomPortalOpen] = React.useState(false)
  const customContainerRef = React.useRef<HTMLDivElement | null>(null)
  const [containerMounted, setContainerMounted] = React.useState(false)
  React.useEffect(() => {
    setContainerMounted(true)
  }, [])

  const [mixedGeomOpen, setMixedGeomOpen] = React.useState(false)
  const [mixedEdge, setMixedEdge] = React.useState<any>(undefined)
  const [mixedAnchor, setMixedAnchor] = React.useState<any>(undefined)
  const [openInertPreserve, setOpenInertPreserve] = React.useState(false)
  const inertContainerRef = React.useRef<HTMLDivElement | null>(null)
  const preInertRef = React.useRef<HTMLDivElement | null>(null)

  const [esc07Open, setEsc07Open] = React.useState(false)
  const [esc07Log, setEsc07Log] = React.useState<string[]>([])
  React.useEffect(() => {
    preInertRef.current?.setAttribute('inert', '')
  }, [])

  React.useEffect(() => {
    const orig = console.error
    console.error = (...args: any[]) => {
      orig(...args)
      const text = args.map(String).join(' ')
      setTimeout(() => {
        setConsoleErrors(prev => [...prev, text])
      }, 0)
    }
    return () => {
      console.error = orig
    }
  }, [])

  return (
    <div data-testid="dialog-fixture-root">
      <h2>Dialog & DOM Anatomy Fixtures</h2>

      {/* Outside Counter element to test isolation true vs false */}
      <section style={{ marginBottom: 16 }}>
        <button
          type="button"
          data-testid="btn-outside-counter"
          onClick={() => setOutsideClicks(c => c + 1)}
        >
          Outside Counter ({outsideClicks})
        </button>
      </section>

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

      {/* 5. Anatomy Validation Fixtures (OV-DOM-08 & OV-DOM-09) */}
      <section data-testid="section-anatomy-validation" style={{ marginTop: 24 }}>
        <h3>Anatomy Validation</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            data-testid="btn-open-dup-backdrop"
            onClick={() => setDupBackdropOpen(true)}
          >
            Open Duplicate Backdrop
          </button>
          <button
            type="button"
            data-testid="btn-open-dup-content"
            onClick={() => setDupContentOpen(true)}
          >
            Open Duplicate Content
          </button>
          <button
            type="button"
            data-testid="btn-open-dup-trigger"
            onClick={() => setDupTriggerOpen(true)}
          >
            Open Duplicate Trigger
          </button>
          <button
            type="button"
            data-testid="btn-open-dup-handle"
            onClick={() => setDupHandleOpen(true)}
          >
            Open Duplicate Handle
          </button>
          <button
            type="button"
            data-testid="btn-open-no-edge-handle"
            onClick={() => setNoEdgeHandleOpen(true)}
          >
            Open Handle Without Edge
          </button>
          <button
            type="button"
            data-testid="btn-open-missing-content"
            onClick={() => setMissingContentOpen(true)}
          >
            Open Missing Content
          </button>
          <button
            type="button"
            data-testid="btn-open-mixed-geometry"
            onClick={() => setMixedGeometryOpen(true)}
          >
            Open Mixed Geometry
          </button>
        </div>

        {dupBackdropOpen && (
          <Overlay open={true} onOpenChange={setDupBackdropOpen}>
            <Overlay.Backdrop data-testid="dup-backdrop-1" />
            <Overlay.Backdrop data-testid="dup-backdrop-2" />
            <Overlay.Content data-testid="dup-backdrop-content">
              <p>Dup Backdrop Content</p>
              <button type="button" data-testid="btn-close-dup-backdrop" onClick={() => setDupBackdropOpen(false)}>
                Close
              </button>
            </Overlay.Content>
          </Overlay>
        )}

        {dupContentOpen && (
          <Overlay open={true} onOpenChange={setDupContentOpen}>
            <Overlay.Content data-testid="dup-content-1">
              <p>Content 1</p>
            </Overlay.Content>
            <Overlay.Content data-testid="dup-content-2">
              <p>Content 2</p>
            </Overlay.Content>
          </Overlay>
        )}

        {dupTriggerOpen && (
          <Overlay open={true} onOpenChange={setDupTriggerOpen}>
            <Overlay.Trigger data-testid="dup-trigger-1">Trigger 1</Overlay.Trigger>
            <Overlay.Trigger data-testid="dup-trigger-2">Trigger 2</Overlay.Trigger>
            <Overlay.Content data-testid="dup-trigger-content">
              <p>Dup Trigger Content</p>
            </Overlay.Content>
          </Overlay>
        )}

        {dupHandleOpen && (
          <Overlay open={true} onOpenChange={setDupHandleOpen} edge="bottom">
            <Overlay.Content data-testid="dup-handle-content">
              <Overlay.Handle data-testid="dup-handle-1" />
              <Overlay.Handle data-testid="dup-handle-2" />
              <p>Dup Handle Content</p>
            </Overlay.Content>
          </Overlay>
        )}

        {noEdgeHandleOpen && (
          <Overlay open={true} onOpenChange={setNoEdgeHandleOpen}>
            <Overlay.Content data-testid="no-edge-handle-content">
              <Overlay.Handle data-testid="no-edge-handle" />
              <p>No Edge Handle Content</p>
            </Overlay.Content>
          </Overlay>
        )}

        {missingContentOpen && (
          <Overlay open={true} onOpenChange={setMissingContentOpen}>
            <Overlay.Backdrop data-testid="missing-content-backdrop" />
          </Overlay>
        )}

        {mixedGeometryOpen && (
          <Overlay open={true} onOpenChange={setMixedGeometryOpen} edge="bottom" anchor={{ x: 100, y: 100 }}>
            <Overlay.Content data-testid="mixed-geometry-content">
              <p>Mixed Geometry Content</p>
            </Overlay.Content>
          </Overlay>
        )}

        <pre data-testid="console-errors-log" style={{ marginTop: 16, background: '#f5f5f5', padding: 8 }}>
          {consoleErrors.join('\n')}
        </pre>
      </section>

      {/* 6. Dynamic / Rerendered Escape Handler (OV-ESC-03) */}
      <section data-testid="section-rerender-escape" style={{ marginTop: 24 }}>
        <h3>Rerendered Escape Handler (OV-ESC-03)</h3>
        <button
          type="button"
          data-testid="btn-open-escape-rerender"
          onClick={() => {
            setRerenderEscapeOpen(true)
            setEscapeBlockCount(0)
            setEscapeRerenderLog([])
          }}
        >
          Open Dynamic Escape Dialog
        </button>
        <Overlay
          open={rerenderEscapeOpen}
          onEscape={e => {
            setEscapeRerenderLog(prev => [...prev, `escape:count=${escapeBlockCount}`])
            if (escapeBlockCount > 0) {
              e.preventDefault()
            }
          }}
          onDismiss={() => {
            setEscapeRerenderLog(prev => [...prev, 'dismiss'])
            setRerenderEscapeOpen(false)
          }}
        >
          <Overlay.Content
            data-testid="escape-rerender-content"
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
            <p data-testid="escape-block-count">Count: {escapeBlockCount}</p>
            <button
              type="button"
              data-testid="btn-increment-escape-block"
              onClick={() => setEscapeBlockCount(c => c + 1)}
            >
              Increment Block Count
            </button>
          </Overlay.Content>
        </Overlay>
        <pre data-testid="escape-rerender-log">{escapeRerenderLog.join(',')}</pre>
      </section>

      {/* 7. AlertDialog Non-Dismissible Escape (OV-ESC-06) */}
      <section data-testid="section-alertdialog" style={{ marginTop: 24 }}>
        <h3>AlertDialog (OV-ESC-06)</h3>
        <button
          type="button"
          data-testid="btn-open-alertdialog"
          onClick={() => {
            setAlertDialogOpen(true)
            setAlertDialogLog([])
          }}
        >
          Open AlertDialog
        </button>
        <Overlay
          open={alertDialogOpen}
          onEscape={e => {
            setAlertDialogLog(prev => [...prev, 'alertdialog:escape'])
            e.preventDefault()
          }}
          onDismiss={() => {
            setAlertDialogLog(prev => [...prev, 'alertdialog:dismiss'])
            setAlertDialogOpen(false)
          }}
        >
          <Overlay.Backdrop
            data-testid="alertdialog-backdrop"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }}
          />
          <Overlay.Content
            data-testid="alertdialog-content"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="alertdialog-title"
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
            <h2 id="alertdialog-title">Confirm Action</h2>
            <button type="button" data-testid="btn-alertdialog-cancel">
              Cancel
            </button>
            <button
              type="button"
              data-testid="btn-alertdialog-destructive"
              data-autofocus
              style={{ color: 'red' }}
            >
              Delete
            </button>
          </Overlay.Content>
        </Overlay>
        <pre data-testid="alertdialog-log">{alertDialogLog.join(',')}</pre>
      </section>

      {/* 8. Presence Exit Coordination (OV-PRES-01, OV-PRES-02, OV-PRES-04) */}
      <section data-testid="section-presence-coordination" style={{ marginTop: 24 }}>
        <h3>Presence Coordination</h3>
        <style>{`
          .presence-backdrop-150 {
            transition: opacity 150ms linear !important;
            opacity: 1;
          }
          .presence-backdrop-150[data-state="closed"] {
            opacity: 0;
          }
          .presence-content-150 {
            transition: opacity 150ms linear, transform 150ms linear !important;
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          .presence-content-150[data-state="closed"] {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
          }

          .presence-backdrop-250 {
            transition: opacity 250ms linear !important;
            opacity: 1;
          }
          .presence-backdrop-250[data-state="closed"] {
            opacity: 0;
          }
          .presence-content-100 {
            transition: opacity 100ms linear, transform 100ms linear !important;
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          .presence-content-100[data-state="closed"] {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
          }

          .presence-backdrop-100 {
            transition: opacity 100ms linear !important;
            opacity: 1;
          }
          .presence-backdrop-100[data-state="closed"] {
            opacity: 0;
          }
          .presence-content-250 {
            transition: opacity 250ms linear, transform 250ms linear !important;
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          .presence-content-250[data-state="closed"] {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
          }

          .presence-no-motion {
            transition: none !important;
            animation: none !important;
          }

          @keyframes child-anim {
            from { opacity: 1; }
            to { opacity: 0.5; }
          }
          .child-anim-50 {
            animation: child-anim 50ms linear !important;
          }
        `}</style>

        {/* 8a. Equal 150ms exit */}
        <button
          type="button"
          data-testid="btn-open-pres-equal"
          onClick={() => setPresEqualOpen(true)}
        >
          Open Pres Equal
        </button>
        <Overlay open={presEqualOpen} onOpenChange={setPresEqualOpen}>
          <Overlay.Backdrop
            data-testid="dialog-pres-equal-backdrop"
            className="presence-backdrop-150"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }}
          />
          <Overlay.Content
            data-testid="dialog-pres-equal-content"
            className="presence-content-150"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              backgroundColor: '#fff',
              padding: 24,
              zIndex: 1001,
            }}
          >
            <p>Presence Equal (150ms)</p>
            <button
              type="button"
              data-testid="btn-close-then-reopen-inner"
              onClick={() => {
                setPresEqualOpen(false)
                setTimeout(() => setPresEqualOpen(true), 40)
              }}
            >
              Close Then Reopen
            </button>
            <button
              type="button"
              data-testid="btn-close-pres-equal"
              onClick={() => setPresEqualOpen(false)}
            >
              Close Pres Equal
            </button>
          </Overlay.Content>
        </Overlay>

        {/* 8b. Backdrop slower (Backdrop 250ms, Content 100ms) */}
        <button
          type="button"
          data-testid="btn-open-pres-backdrop-slower"
          onClick={() => setPresBackdropSlowerOpen(true)}
        >
          Open Pres Backdrop Slower
        </button>
        <Overlay open={presBackdropSlowerOpen} onOpenChange={setPresBackdropSlowerOpen}>
          <Overlay.Backdrop
            data-testid="dialog-pres-backdrop-slower-backdrop"
            className="presence-backdrop-250"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }}
          />
          <Overlay.Content
            data-testid="dialog-pres-backdrop-slower-content"
            className="presence-content-100"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              backgroundColor: '#fff',
              padding: 24,
              zIndex: 1001,
            }}
          >
            <p>Backdrop 250ms, Content 100ms</p>
            <button
              type="button"
              data-testid="btn-close-pres-backdrop-slower"
              onClick={() => setPresBackdropSlowerOpen(false)}
            >
              Close Pres Backdrop Slower
            </button>
          </Overlay.Content>
        </Overlay>

        {/* 8c. Content slower (Backdrop 100ms, Content 250ms) */}
        <button
          type="button"
          data-testid="btn-open-pres-content-slower"
          onClick={() => setPresContentSlowerOpen(true)}
        >
          Open Pres Content Slower
        </button>
        <Overlay open={presContentSlowerOpen} onOpenChange={setPresContentSlowerOpen}>
          <Overlay.Backdrop
            data-testid="dialog-pres-content-slower-backdrop"
            className="presence-backdrop-100"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }}
          />
          <Overlay.Content
            data-testid="dialog-pres-content-slower-content"
            className="presence-content-250"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              backgroundColor: '#fff',
              padding: 24,
              zIndex: 1001,
            }}
          >
            <p>Backdrop 100ms, Content 250ms</p>
            <button
              type="button"
              data-testid="btn-close-pres-content-slower"
              onClick={() => setPresContentSlowerOpen(false)}
            >
              Close Pres Content Slower
            </button>
          </Overlay.Content>
        </Overlay>

        {/* 8d. No motion (OV-PRES-04) */}
        <button
          type="button"
          data-testid="btn-open-pres-no-motion"
          onClick={() => setPresNoMotionOpen(true)}
        >
          Open Pres No Motion
        </button>
        <Overlay open={presNoMotionOpen} onOpenChange={setPresNoMotionOpen}>
          <Overlay.Backdrop
            data-testid="dialog-pres-no-motion-backdrop"
            className="presence-no-motion"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }}
          />
          <Overlay.Content
            data-testid="dialog-pres-no-motion-content"
            className="presence-no-motion"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              backgroundColor: '#fff',
              padding: 24,
              zIndex: 1001,
            }}
          >
            <p>No Motion (Instant)</p>
            <button
              type="button"
              data-testid="btn-close-pres-no-motion"
              onClick={() => setPresNoMotionOpen(false)}
            >
              Close Pres No Motion
            </button>
          </Overlay.Content>
        </Overlay>

        {/* 8e. Child animation ignored (OV-PRES-03) */}
        <button
          type="button"
          data-testid="btn-open-pres-child-anim"
          onClick={() => setPresChildAnimOpen(true)}
        >
          Open Pres Child Anim
        </button>
        <Overlay open={presChildAnimOpen} onOpenChange={setPresChildAnimOpen}>
          <Overlay.Backdrop
            data-testid="dialog-pres-child-anim-backdrop"
            className="presence-backdrop-250"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }}
          />
          <Overlay.Content
            data-testid="dialog-pres-child-anim-content"
            className="presence-content-250"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              backgroundColor: '#fff',
              padding: 24,
              zIndex: 1001,
            }}
          >
            <p>Parent with 250ms exit</p>
            <div data-testid="pres-child-anim-target" className="child-anim-50">
              Animated Child (50ms)
            </div>
            <button
              type="button"
              data-testid="btn-close-pres-child-anim"
              onClick={() => setPresChildAnimOpen(false)}
            >
              Close Pres Child Anim
            </button>
          </Overlay.Content>
        </Overlay>
      </section>

      {/* 9. Modal Pointer Isolation Fixtures (OV-POINTER-01, 03, 04, 05, 06) */}
      <section data-testid="section-pointer-isolation" style={{ marginTop: 24 }}>
        <h3>Modal Pointer Isolation</h3>

        {/* 9a. OV-POINTER-01: Background Controls & Inside Actions */}
        <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            data-testid="btn-pointer-bg-click"
            onClick={() => setPointerIsoBgClicks(c => c + 1)}
          >
            BG Click ({pointerIsoBgClicks})
          </button>
          <input
            type="text"
            data-testid="input-pointer-bg-text"
            placeholder="BG text input"
            value={pointerIsoBgVal}
            onChange={e => setPointerIsoBgVal(e.target.value)}
          />
          <button
            type="button"
            data-testid="btn-open-pointer-iso"
            onClick={() => setPointerIsoOpen(true)}
          >
            Open Pointer Isolation Modal
          </button>
        </div>

        <Overlay open={pointerIsoOpen} onOpenChange={setPointerIsoOpen}>
          <Overlay.Backdrop
            data-testid="pointer-iso-backdrop"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }}
          />
          <Overlay.Content
            data-testid="pointer-iso-content"
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
            <h4>Pointer Isolation Content</h4>
            <button
              type="button"
              data-testid="btn-pointer-inside-action"
              onClick={() => setPointerIsoInsideClicks(c => c + 1)}
            >
              Inside Action ({pointerIsoInsideClicks})
            </button>
            <button
              type="button"
              data-testid="btn-close-pointer-iso"
              style={{ marginLeft: 8 }}
              onClick={() => setPointerIsoOpen(false)}
            >
              Close
            </button>
          </Overlay.Content>
        </Overlay>

        {/* 9b. OV-POINTER-03: Out-of-order nested modal close */}
        <div style={{ marginTop: 16, marginBottom: 12, display: 'flex', gap: 8 }}>
          <button
            type="button"
            data-testid="btn-nested-modal-bg-target"
            onClick={() => setNestedModalBgClicks(c => c + 1)}
          >
            Nested Modal BG Target ({nestedModalBgClicks})
          </button>
          <button
            type="button"
            data-testid="btn-open-modal-a"
            onClick={() => setNestedModalAOpen(true)}
          >
            Open Modal A
          </button>
          <button
            type="button"
            data-testid="btn-close-modal-a-external"
            data-reference-overlay-ignore=""
            onClick={() => setNestedModalAOpen(false)}
          >
            Close Modal A (External)
          </button>
        </div>

        <Overlay
          open={nestedModalAOpen}
          onOpenChange={setNestedModalAOpen}
          onOutsidePress={e => e.preventDefault()}
        >
          <Overlay.Backdrop
            data-testid="modal-a-backdrop"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 1000 }}
          />
          <Overlay.Content
            data-testid="modal-a-content"
            role="dialog"
            style={{
              position: 'fixed',
              top: '40%',
              left: '40%',
              backgroundColor: '#fff',
              padding: 20,
              zIndex: 1001,
            }}
          >
            <h4>Modal A</h4>
            <button
              type="button"
              data-testid="btn-open-modal-b"
              onClick={() => setNestedModalBOpen(true)}
            >
              Open Modal B
            </button>
            <button
              type="button"
              data-testid="btn-close-modal-a"
              style={{ marginLeft: 8 }}
              onClick={() => setNestedModalAOpen(false)}
            >
              Close Modal A
            </button>
          </Overlay.Content>
        </Overlay>

        <Overlay
          open={nestedModalBOpen}
          onOpenChange={setNestedModalBOpen}
          onOutsidePress={e => e.preventDefault()}
        >
          <Overlay.Backdrop
            data-testid="modal-b-backdrop"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1002 }}
          />
          <Overlay.Content
            data-testid="modal-b-content"
            role="dialog"
            style={{
              position: 'fixed',
              top: '60%',
              left: '60%',
              backgroundColor: '#fff',
              padding: 20,
              zIndex: 1003,
            }}
          >
            <h4>Modal B</h4>
            <button
              type="button"
              data-testid="btn-close-modal-b"
              onClick={() => setNestedModalBOpen(false)}
            >
              Close Modal B
            </button>
          </Overlay.Content>
        </Overlay>

        {/* 9c. OV-POINTER-04: Overlapping Modal Content (Only top Content interactive) */}
        <div style={{ marginTop: 16, marginBottom: 12, display: 'flex', gap: 8 }}>
          <button
            type="button"
            data-testid="btn-open-overlap-lower"
            onClick={() => setOverlapLowerOpen(true)}
          >
            Open Lower Modal
          </button>
          <button
            type="button"
            data-testid="btn-open-overlap-top"
            onClick={() => setOverlapTopOpen(true)}
          >
            Open Top Modal
          </button>
        </div>

        <Overlay open={overlapLowerOpen} onOpenChange={setOverlapLowerOpen}>
          <Overlay.Backdrop
            data-testid="overlap-lower-backdrop"
            style={{ backgroundColor: 'rgba(0,0,0,0.2)', zIndex: 1000 }}
          />
          <Overlay.Content
            data-testid="overlap-lower-content"
            role="dialog"
            style={{
              position: 'fixed',
              top: '100px',
              left: '100px',
              width: '350px',
              height: '350px',
              backgroundColor: '#eef',
              padding: 20,
              zIndex: 1001,
            }}
          >
            <h4>Lower Modal Content</h4>
            <button
              type="button"
              data-testid="btn-overlap-lower-action"
              onClick={() => setOverlapLowerClicks(c => c + 1)}
            >
              Lower Action ({overlapLowerClicks})
            </button>
            <button
              type="button"
              data-testid="btn-open-overlap-top-from-lower"
              style={{ marginLeft: 8 }}
              onClick={() => setOverlapTopOpen(true)}
            >
              Open Top Modal
            </button>
            <button
              type="button"
              data-testid="btn-close-overlap-lower"
              style={{ marginLeft: 8 }}
              onClick={() => setOverlapLowerOpen(false)}
            >
              Close Lower
            </button>
          </Overlay.Content>
        </Overlay>

        <Overlay
          open={overlapTopOpen}
          onOpenChange={setOverlapTopOpen}
          onOutsidePress={e => e.preventDefault()}
        >
          <Overlay.Backdrop
            data-testid="overlap-top-backdrop"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 1002 }}
          />
          <Overlay.Content
            data-testid="overlap-top-content"
            role="dialog"
            style={{
              position: 'fixed',
              top: '180px',
              left: '180px',
              width: '300px',
              height: '300px',
              backgroundColor: '#fee',
              padding: 20,
              zIndex: 1003,
            }}
          >
            <h4>Top Modal Content</h4>
            <button
              type="button"
              data-testid="btn-overlap-top-action"
              onClick={() => setOverlapTopClicks(c => c + 1)}
            >
              Top Action ({overlapTopClicks})
            </button>
            <button
              type="button"
              data-testid="btn-close-overlap-top"
              style={{ marginLeft: 8 }}
              onClick={() => setOverlapTopOpen(false)}
            >
              Close Top
            </button>
          </Overlay.Content>
        </Overlay>

        {/* 9d. OV-POINTER-05: Retains pointer isolation through animated exit */}
        <div style={{ marginTop: 16, marginBottom: 12, display: 'flex', gap: 8 }}>
          <button
            type="button"
            data-testid="btn-pres-pointer-exit-bg"
            onClick={() => setPointerExitBgClicks(c => c + 1)}
          >
            Pres Pointer Exit BG ({pointerExitBgClicks})
          </button>
          <button
            type="button"
            data-testid="btn-open-pres-pointer-exit"
            onClick={() => setPointerExitOpen(true)}
          >
            Open Pres Pointer Exit
          </button>
        </div>

        <Overlay open={pointerExitOpen} onOpenChange={setPointerExitOpen}>
          <Overlay.Backdrop
            data-testid="dialog-pres-pointer-exit-backdrop"
            className="presence-backdrop-250"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }}
          />
          <Overlay.Content
            data-testid="dialog-pres-pointer-exit-content"
            className="presence-content-250"
            role="dialog"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              backgroundColor: '#fff',
              padding: 24,
              zIndex: 1001,
            }}
          >
            <p>Presence Pointer Exit Modal (250ms)</p>
            <button
              type="button"
              data-testid="btn-close-pres-pointer-exit"
              onClick={() => setPointerExitOpen(false)}
            >
              Close Pres Pointer Exit
            </button>
          </Overlay.Content>
        </Overlay>

        {/* 9e. OV-POINTER-06: Cancel pointer teardown when reopening during exit */}
        <div style={{ marginTop: 16, marginBottom: 12, display: 'flex', gap: 8 }}>
          <button
            type="button"
            data-testid="btn-reopen-pointer-bg"
            onClick={() => setReopenPointerBgClicks(c => c + 1)}
          >
            Reopen Pointer BG ({reopenPointerBgClicks})
          </button>
          <button
            type="button"
            data-testid="btn-open-reopen-pointer"
            onClick={() => setReopenPointerOpen(true)}
          >
            Open Reopen Pointer Dialog
          </button>
        </div>

        <Overlay
          open={reopenPointerOpen}
          onOpenChange={setReopenPointerOpen}
          onOutsidePress={e => e.preventDefault()}
        >
          <Overlay.Backdrop
            data-testid="dialog-reopen-pointer-backdrop"
            className="presence-backdrop-250"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }}
          />
          <Overlay.Content
            data-testid="dialog-reopen-pointer-content"
            className="presence-content-250"
            role="dialog"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              backgroundColor: '#fff',
              padding: 24,
              zIndex: 1001,
            }}
          >
            <p>Reopen Pointer Content</p>
            <button
              type="button"
              data-testid="btn-reopen-pointer-quick-cycle"
              onClick={() => {
                setReopenPointerOpen(false)
                setTimeout(() => setReopenPointerOpen(true), 50)
              }}
            >
              Close then Reopen
            </button>
            <button
              type="button"
              data-testid="btn-close-reopen-pointer-final"
              style={{ marginLeft: 8 }}
              onClick={() => setReopenPointerOpen(false)}
            >
              Final Close
            </button>
          </Overlay.Content>
        </Overlay>
      </section>

      {/* 10. Trigger Interaction Suite (OV-TRG-03, OV-TRG-04, OV-TRG-05) */}
      <section data-testid="section-trigger-suite" style={{ marginTop: 32 }}>
        <h3>Trigger Interaction Suite</h3>

        {/* OV-TRG-03: Activate + preventDefault + disabled */}
        <div data-testid="trg-03-log">{trg03Log.join(',')}</div>
        <button
          type="button"
          data-testid="btn-reset-trg-03-log"
          onClick={() => setTrg03Log([])}
        >
          Reset Log
        </button>

        {/* Normal trigger */}
        <Overlay
          open={trg03Open}
          onOpenChange={setTrg03Open}
          isolation={false}
          onOpen={() => setTrg03Log(l => [...l, 'onOpen'])}
          onDismiss={() => setTrg03Log(l => [...l, 'onDismiss'])}
        >
          <Overlay.Trigger
            data-testid="trg-03-normal"
            onClick={() => setTrg03Log(l => [...l, 'consumerClick'])}
          >
            Trigger Normal
          </Overlay.Trigger>
          <Overlay.Content
            data-testid="trg-03-normal-content"
            style={{ position: 'fixed', top: 100, left: 100, background: '#fff', padding: 16 }}
          >
            <p>Trg 03 Normal Content</p>
          </Overlay.Content>
        </Overlay>

        {/* Prevented trigger */}
        <Overlay
          open={trg03PreventedOpen}
          onOpenChange={setTrg03PreventedOpen}
          isolation={false}
          onOpen={() => setTrg03Log(l => [...l, 'onOpen'])}
          onDismiss={() => setTrg03Log(l => [...l, 'onDismiss'])}
        >
          <Overlay.Trigger
            data-testid="trg-03-prevented"
            onClick={e => {
              e.preventDefault()
              setTrg03Log(l => [...l, 'consumerPrevented'])
            }}
          >
            Trigger Prevented
          </Overlay.Trigger>
          <Overlay.Content
            data-testid="trg-03-prevented-content"
            style={{ position: 'fixed', top: 150, left: 100, background: '#fff', padding: 16 }}
          >
            <p>Trg 03 Prevented Content</p>
          </Overlay.Content>
        </Overlay>

        {/* Disabled trigger */}
        <Overlay
          open={trg03DisabledOpen}
          onOpenChange={setTrg03DisabledOpen}
          isolation={false}
          onOpen={() => setTrg03Log(l => [...l, 'onOpen'])}
          onDismiss={() => setTrg03Log(l => [...l, 'onDismiss'])}
        >
          <Overlay.Trigger
            data-testid="trg-03-disabled"
            disabled={true}
            onClick={() => setTrg03Log(l => [...l, 'consumerDisabled'])}
          >
            Trigger Disabled
          </Overlay.Trigger>
          <Overlay.Content
            data-testid="trg-03-disabled-content"
            style={{ position: 'fixed', top: 200, left: 100, background: '#fff', padding: 16 }}
          >
            <p>Trg 03 Disabled Content</p>
          </Overlay.Content>
        </Overlay>

        {/* OV-TRG-04: Outside focus lock when isolation focus is on */}
        <Overlay open={trg04Open} onOpenChange={setTrg04Open}>
          <Overlay.Trigger data-testid="btn-open-trg-04">
            Open Isolating Focus Lock
          </Overlay.Trigger>
          <Overlay.Backdrop data-testid="trg-04-backdrop" />
          <Overlay.Content
            data-testid="trg-04-content"
            role="dialog"
            style={{ position: 'fixed', top: 250, left: 100, background: '#fff', padding: 20, zIndex: 1001 }}
          >
            <button type="button" data-testid="btn-trg-04-inner-1">
              Inner 1
            </button>
            <button type="button" data-testid="btn-trg-04-inner-2">
              Inner 2
            </button>
            <button
              type="button"
              data-testid="btn-close-trg-04"
              onClick={() => setTrg04Open(false)}
            >
              Close
            </button>
          </Overlay.Content>
        </Overlay>

        {/* OV-TRG-05: Tab bridge from Trigger into Content when isolation focus is off */}
        <div style={{ marginTop: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
          <button type="button" data-testid="btn-before-trg-05">
            Before Trigger
          </button>
          <Overlay
            open={trg05Open}
            onOpenChange={setTrg05Open}
            isolation={false}
            onDismiss={() => setTrg05DismissCount(c => c + 1)}
          >
            <Overlay.Trigger data-testid="btn-open-trg-05">
              Trigger Modeless Bridge
            </Overlay.Trigger>
            <Overlay.Content
              data-testid="trg-05-content"
              style={{
                position: 'fixed',
                top: 320,
                left: 100,
                background: '#fff',
                border: '1px solid #ccc',
                padding: 16,
                zIndex: 1001,
              }}
            >
              <button type="button" data-testid="btn-trg-05-inner-1">
                Bridge Inner 1
              </button>
              <button type="button" data-testid="btn-trg-05-inner-2">
                Bridge Inner 2
              </button>
            </Overlay.Content>
          </Overlay>
          <button type="button" data-testid="btn-after-trg-05">
            After Trigger
          </button>
          <span data-testid="trg-05-dismiss-count">{trg05DismissCount}</span>
        </div>
      </section>

      {/* 11. OV-DOM-04: Overlay.Portal container and Trigger stays in source DOM */}
      <section data-testid="section-dom-04" style={{ marginTop: 24 }}>
        <h3>OV-DOM-04: Overlay.Portal container=element</h3>
        <div
          ref={customContainerRef}
          data-testid="custom-portal-target"
          style={{ border: '2px dashed #6366f1', padding: 12, minHeight: 80 }}
        >
          <p>Custom Portal Container</p>
        </div>

        <div style={{ marginTop: 12 }}>
          <Overlay open={customPortalOpen} onOpenChange={setCustomPortalOpen}>
            <Overlay.Trigger data-testid="btn-custom-portal-trigger">
              Open Custom Portal Dialog
            </Overlay.Trigger>
            {containerMounted && customContainerRef.current && (
              <Overlay.Portal container={customContainerRef.current}>
                <Overlay.Backdrop
                  data-testid="custom-portal-backdrop"
                  style={{ backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 1000 }}
                />
                <Overlay.Content
                  data-testid="custom-portal-content"
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
                  <p>Custom Portalled Content</p>
                  <button
                    type="button"
                    data-testid="btn-close-custom-portal"
                    onClick={() => setCustomPortalOpen(false)}
                  >
                    Close
                  </button>
                </Overlay.Content>
              </Overlay.Portal>
            )}
          </Overlay>
        </div>
      </section>

      {/* 12. OV-EDGE-02: edge + anchor mutual exclusion */}
      <section data-testid="section-mixed-geometry" style={{ marginTop: 24 }}>
        <h3>OV-EDGE-02: Mixed edge and anchor diagnostic</h3>
        <button
          type="button"
          data-testid="btn-open-mixed-geom"
          onClick={() => {
            setMixedEdge('bottom')
            setMixedAnchor({ x: 100, y: 100 })
            setMixedGeomOpen(true)
          }}
        >
          Open Mixed Geometry
        </button>
        <Overlay
          open={mixedGeomOpen}
          onOpenChange={setMixedGeomOpen}
          edge={mixedEdge}
          anchor={mixedAnchor}
        >
          <Overlay.Content
            data-testid="content-mixed-geom"
            style={{ width: 100, height: 50, background: 'red' }}
          >
            Mixed Geometry Content
          </Overlay.Content>
        </Overlay>
      </section>

      {/* 13. OV-INERT-02: Pre-existing isolation attributes */}
      <section
        ref={inertContainerRef}
        data-testid="section-inert-preservation"
        style={{ marginTop: 24, border: '1px solid #ddd', padding: 12 }}
      >
        <h3>OV-INERT-02: Preserve pre-existing inert & aria-hidden</h3>
        <div ref={preInertRef} data-testid="pre-existing-inert" style={{ padding: 4 }}>
          Pre-existing inert node
        </div>
        <div data-testid="pre-existing-aria-hidden" aria-hidden="true" style={{ padding: 4 }}>
          Pre-existing aria-hidden node
        </div>
        <div data-testid="ordinary-sibling-node" style={{ padding: 4 }}>
          Ordinary sibling node
        </div>
        <button
          type="button"
          data-testid="btn-open-inert-preserve"
          onClick={() => setOpenInertPreserve(true)}
          style={{ marginTop: 8 }}
        >
          Open Inert Preserve Dialog
        </button>
        <Overlay open={openInertPreserve} onOpenChange={setOpenInertPreserve}>
          {containerMounted && inertContainerRef.current && (
            <Overlay.Portal container={inertContainerRef.current}>
              <Overlay.Content
                data-testid="content-inert-preserve"
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
                <p>Inert Preserve Content</p>
                <button
                  type="button"
                  data-testid="btn-close-inert-preserve"
                  onClick={() => setOpenInertPreserve(false)}
                >
                  Close
                </button>
              </Overlay.Content>
            </Overlay.Portal>
          )}
        </Overlay>
      </section>

      {/* OV-ESC-07: Native top-layer popover consumes first Escape */}
      <section data-testid="section-ov-esc-07" style={{ marginTop: 24 }}>
        <h3>OV-ESC-07: Native popover Escape precedence</h3>
        <button
          type="button"
          data-testid="btn-open-esc-07"
          onClick={() => {
            setEsc07Log(['open'])
            setEsc07Open(true)
          }}
        >
          Open Escape Popover Dialog
        </button>
        <pre data-testid="esc-07-log">{esc07Log.join(',')}</pre>
        <Overlay
          open={esc07Open}
          onOpenChange={setEsc07Open}
          onEscape={() => setEsc07Log(l => [...l, 'escape'])}
          onDismiss={() => {
            setEsc07Log(l => [...l, 'dismiss'])
            setEsc07Open(false)
          }}
        >
          <Overlay.Backdrop
            data-testid="esc-07-backdrop"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000 }}
          />
          <Overlay.Content
            data-testid="esc-07-content"
            role="dialog"
            style={{
              position: 'fixed',
              top: '40%',
              left: '40%',
              background: '#fff',
              padding: 24,
              zIndex: 1001,
            }}
          >
            <p>Native popover host</p>
            <button
              type="button"
              data-testid="btn-show-native-popover"
              popoverTarget="ov-esc-07-popover"
            >
              Show Native Popover
            </button>
            <div
              id="ov-esc-07-popover"
              data-testid="native-popover"
              popover="auto"
              style={{ padding: 12, background: '#fef3c7', border: '1px solid #ca8a04' }}
            >
              <p>Native top-layer popover</p>
              <button type="button" data-testid="btn-native-popover-inner">
                Inside Native Popover
              </button>
            </div>
            <button
              type="button"
              data-testid="btn-close-esc-07"
              onClick={() => setEsc07Open(false)}
            >
              Close
            </button>
          </Overlay.Content>
        </Overlay>
      </section>
    </div>
  )
}
