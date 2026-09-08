import * as React from 'react'
import { Div } from '@reference-ui/react'
import { Overlay } from '@reference-ui/lib'

export function OverlayFixture() {
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [unboundOpen, setUnboundOpen] = React.useState(false)
  const [anchoredOpen, setAnchoredOpen] = React.useState(false)
  const [themedAnchoredOpen, setThemedAnchoredOpen] = React.useState(false)
  const [lightThemedAnchoredOpen, setLightThemedAnchoredOpen] = React.useState(false)

  return (
    <div data-testid="overlay-fixture-root">
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

      <button type="button" data-testid="btn-outside-element">

        Outside Button
      </button>
    </div>
  )
}
