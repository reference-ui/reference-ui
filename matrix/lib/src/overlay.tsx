import * as React from 'react'
import { Div } from '@reference-ui/react'
import { Overlay } from '@reference-ui/lib'

export function OverlayFixture() {
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [unboundOpen, setUnboundOpen] = React.useState(false)
  const [anchoredOpen, setAnchoredOpen] = React.useState(false)
  const [themedAnchoredOpen, setThemedAnchoredOpen] = React.useState(false)
  const [lightThemedAnchoredOpen, setLightThemedAnchoredOpen] = React.useState(false)
  const [parentOpen, setParentOpen] = React.useState(false)
  const [childOpen, setChildOpen] = React.useState(false)
  const [escapeLog, setEscapeLog] = React.useState<string[]>([])
  const [escapeOpen, setEscapeOpen] = React.useState(false)
  const [blockEscape, setBlockEscape] = React.useState(false)
  const [edgeOpen, setEdgeOpen] = React.useState(false)
  const [outsideClicks, setOutsideClicks] = React.useState(0)

  return (
    <div data-testid="overlay-fixture-root" style={{ minHeight: '200vh' }}>
      <h1>Overlay Fixture</h1>

      <section data-testid="overlay-dialog-section">
        <h2>Isolating dialog (Trigger + Backdrop)</h2>
        <Overlay open={dialogOpen} onOpenChange={setDialogOpen}>
          <Overlay.Trigger data-testid="btn-open-overlay">
            Open Dialog
          </Overlay.Trigger>

          <Overlay.Backdrop
            data-testid="overlay-backdrop"
            style={{
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 1000,
            }}
          />

          <Overlay.Content
            data-testid="overlay-content"
            role="dialog"
            aria-modal="true"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: '#fff',
              padding: '24px',
              borderRadius: '8px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
              zIndex: 1001,
            }}
          >
            <h2 data-testid="overlay-title">Dialog Title</h2>
            <p>Dialog description content.</p>

            <button type="button" data-testid="btn-inside-first">
              First Action
            </button>
            <button
              type="button"
              data-testid="btn-close-overlay"
              onClick={() => setDialogOpen(false)}
            >
              Close
            </button>
          </Overlay.Content>
        </Overlay>
      </section>

      <section data-testid="overlay-unbound-section" style={{ marginTop: 32 }}>
        <h2>Unbound (no Trigger, no coordinates from Overlay)</h2>
        <button
          type="button"
          data-testid="btn-open-unbound"
          onClick={() => setUnboundOpen(true)}
        >
          Open unbound
        </button>
        <Overlay open={unboundOpen} onOpenChange={setUnboundOpen}>
          <Overlay.Content data-testid="overlay-unbound-content" role="dialog">
            <p data-testid="overlay-unbound-title">Unbound content</p>
            <button
              type="button"
              data-testid="btn-close-unbound"
              onClick={() => setUnboundOpen(false)}
            >
              Close unbound
            </button>
          </Overlay.Content>
        </Overlay>
      </section>

      <section data-testid="overlay-anchored-section" style={{ marginTop: 32 }}>
        <h2>Anchored (isolation off)</h2>
        <Overlay
          open={anchoredOpen}
          onOpenChange={setAnchoredOpen}
          isolation={false}
        >
          <Overlay.Trigger data-testid="btn-open-anchored">
            Open anchored
          </Overlay.Trigger>
          <Overlay.Content
            data-testid="overlay-anchored-content"
            placement="bottom-start"
            offset={8}
            style={{
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              padding: '12px',
              zIndex: 20,
            }}
          >
            Anchored panel
          </Overlay.Content>
        </Overlay>
      </section>

      <section data-testid="overlay-themed-portal-section" style={{ marginTop: 32 }}>
        <h2>Themed portal (dark color mode)</h2>
        <Div colorMode="dark" bg="gray.950" p="4" minH="20r" borderRadius="md">
          <Overlay
            open={themedAnchoredOpen}
            onOpenChange={setThemedAnchoredOpen}
            isolation={false}
          >
            <Overlay.Trigger data-testid="btn-open-themed-anchored">
              Open themed popover
            </Overlay.Trigger>
            <Overlay.Content
              data-testid="overlay-themed-content"
              placement="bottom-start"
              offset={8}
              bg="ui.dialog.background"
              color="ui.dialog.foreground"
              border="1px solid"
              borderColor="ui.dialog.border"
              borderRadius="md"
              p="3r"
              minW="24r"
              zIndex={20}
            >
              Themed popover body
            </Overlay.Content>
          </Overlay>
        </Div>
      </section>

      <section data-testid="overlay-light-themed-portal-section" style={{ marginTop: 32 }}>
        <h2>Themed portal (light color mode)</h2>
        <Div colorMode="light" bg="gray.50" p="4" minH="20r" borderRadius="md">
          <Overlay
            open={lightThemedAnchoredOpen}
            onOpenChange={setLightThemedAnchoredOpen}
            isolation={false}
          >
            <Overlay.Trigger data-testid="btn-open-light-themed-anchored">
              Open light themed popover
            </Overlay.Trigger>
            <Overlay.Content
              data-testid="overlay-light-themed-content"
              placement="bottom-start"
              offset={8}
              bg="ui.dialog.background"
              color="ui.dialog.foreground"
              border="1px solid"
              borderColor="ui.dialog.border"
              borderRadius="md"
              p="3r"
              minW="24r"
              zIndex={20}
            >
              Light themed popover body
            </Overlay.Content>
          </Overlay>
        </Div>
      </section>

      <button
        type="button"
        data-testid="btn-outside-element"
        onClick={() => setOutsideClicks(c => c + 1)}
      >
        Outside Button ({outsideClicks})
      </button>

      <section data-testid="overlay-nested-section" style={{ marginTop: 32 }}>
        <h2>Nested layers</h2>
        <Overlay
          open={parentOpen}
          onOpenChange={setParentOpen}
          onDismiss={() => setParentOpen(false)}
        >
          <Overlay.Trigger data-testid="btn-open-parent">Open parent</Overlay.Trigger>
          <Overlay.Backdrop
            data-testid="overlay-parent-backdrop"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          />
          <Overlay.Content
            data-testid="overlay-parent-content"
            role="dialog"
            aria-modal="true"
            style={{
              position: 'fixed',
              top: '40%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: '#fff',
              padding: 24,
              zIndex: 1001,
            }}
          >
            <p>Parent dialog</p>
            <button type="button" data-testid="btn-parent-inner">
              Parent control
            </button>
            <div style={{ height: 48 }} />
            <Overlay
              open={childOpen}
              onOpenChange={setChildOpen}
              onDismiss={() => setChildOpen(false)}
              isolation={false}
            >
              <Overlay.Trigger data-testid="btn-open-child">Open child</Overlay.Trigger>
              <Overlay.Content
                data-testid="overlay-child-content"
                role="dialog"
                placement="right-start"
                offset={12}
                style={{
                  backgroundColor: '#fff',
                  padding: 16,
                  border: '1px solid #ccc',
                  minWidth: 160,
                }}
              >
                <p>Child dialog</p>
                <button type="button" data-testid="btn-child-inner">
                  Child control
                </button>
              </Overlay.Content>
            </Overlay>
          </Overlay.Content>
        </Overlay>
      </section>

      <section data-testid="overlay-escape-section" style={{ marginTop: 32 }}>
        <h2>Escape callbacks</h2>
        <label>
          <input
            type="checkbox"
            data-testid="chk-block-escape"
            checked={blockEscape}
            onChange={e => setBlockEscape(e.target.checked)}
          />
          prevent Escape
        </label>
        <pre data-testid="overlay-escape-log">{escapeLog.join(',')}</pre>
        <Overlay
          open={escapeOpen}
          onOpenChange={setEscapeOpen}
          onEscape={event => {
            setEscapeLog(l => [...l, 'escape'])
            if (blockEscape) event.preventDefault()
          }}
          onDismiss={() => {
            setEscapeLog(l => [...l, 'dismiss'])
            setEscapeOpen(false)
          }}
        >
          <Overlay.Trigger data-testid="btn-open-escape">Open escape</Overlay.Trigger>
          <Overlay.Backdrop
            data-testid="overlay-escape-backdrop"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          />
          <Overlay.Content
            data-testid="overlay-escape-content"
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
            <button type="button" data-testid="btn-escape-inner">
              Inside
            </button>
          </Overlay.Content>
        </Overlay>
      </section>

      <section data-testid="overlay-edge-section" style={{ marginTop: 32 }}>
        <h2>Edge sheet</h2>
        <Overlay open={edgeOpen} onOpenChange={setEdgeOpen} edge="bottom">
          <Overlay.Trigger data-testid="btn-open-edge">Open edge</Overlay.Trigger>
          <Overlay.Backdrop
            data-testid="overlay-edge-backdrop"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          />
          <Overlay.Content
            data-testid="overlay-edge-content"
            role="dialog"
            style={{
              backgroundColor: '#fff',
              padding: 24,
              minHeight: 240,
            }}
          >
            <Overlay.Handle data-testid="overlay-handle" />
            <p>Edge drawer</p>
            <button type="button" data-testid="btn-close-edge" onClick={() => setEdgeOpen(false)}>
              Close edge
            </button>
          </Overlay.Content>
        </Overlay>
      </section>
    </div>
  )
}
