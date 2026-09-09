import * as React from 'react'
import { Overlay, Popover, overlayStackStore } from '@reference-ui/lib'
import { Div, Span } from '@reference-ui/react'

export function PopoverFixture() {
  const [open, setOpen] = React.useState(false)
  const fixture = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('fixture') : null

  if (fixture === 'Placements') {
    return (
      <div data-testid="popover-fixture-root">
        <Div display="grid" gridTemplateColumns="repeat(2, 1fr)" gap="6r" p="8r">
          {(['top', 'right', 'bottom', 'left'] as const).map(placement => (
            <Popover key={placement}>
              <Popover.Trigger>
                {placement}
              </Popover.Trigger>
              <Popover.Content
                p="2r"
                bg="ui.dialog.background"
                borderRadius="sm"
                border="1px solid"
                borderColor="ui.dialog.border"
                placement={placement}
                offset={8}
              >
                <Span fontSize="3r">placement=&quot;{placement}&quot;</Span>
              </Popover.Content>
            </Popover>
          ))}
        </Div>
      </div>
    )
  }

  if (fixture === 'ClickToOpen') {
    return (
      <div data-testid="popover-fixture-root">
        <Div p="4r">
          <Popover>
            <Popover.Trigger>
              Open popover
            </Popover.Trigger>
            <Popover.Content
              p="3.5r"
              bg="ui.dialog.background"
              color="ui.dialog.foreground"
              borderRadius="md"
              border="1px solid"
              borderColor="ui.dialog.border"
              boxShadow="0 4px 16px rgba(0,0,0,0.15)"
              placement="bottom-start"
              offset={8}
            >
              <Div display="flex" flexDirection="column" gap="2r">
                <Span fontWeight="600" fontSize="3.5r">
                  Popover title
                </Span>
                <Span fontSize="3r" color="design.text.light">
                  Non-isolating floating content anchored to the trigger.
                </Span>
                <Popover.Close alignSelf="flex-start">
                  Close
                </Popover.Close>
              </Div>
              <Popover.Arrow data-testid="popover-arrow" />
            </Popover.Content>
          </Popover>
        </Div>
      </div>
    )
  }

  if (fixture === 'HoverCard') {
    return (
      <div data-testid="popover-fixture-root">
        <Div p="4r">
          <Popover openOnHover openDelay={300} closeDelay={200}>
            <Popover.Trigger>
              Hover for preview
            </Popover.Trigger>
            <Popover.Content
              p="3r"
              bg="ui.dialog.background"
              borderRadius="md"
              border="1px solid"
              borderColor="ui.dialog.border"
              boxShadow="0 4px 12px rgba(0,0,0,0.12)"
              placement="top"
              maxW="50r"
            >
              <Span fontSize="3r">
                Hover-opened popover with grace area for pointer travel.
              </Span>
              <Popover.Arrow />
            </Popover.Content>
          </Popover>
        </Div>
      </div>
    )
  }

  if (fixture === 'HoverGrace') {
    return <HoverGraceFixture />
  }

  if (fixture === 'NestedLayer') {
    return <NestedLayerFixture />
  }

  return (
    <div data-testid="popover-fixture-root">
      <h1>Popover Fixture</h1>

      <Popover open={open} onOpenChange={setOpen}>
        <Popover.Trigger data-testid="btn-popover-trigger">
          Open Popover
        </Popover.Trigger>

        <Popover.Content
          data-testid="popover-content"
          placement="bottom-start"
          offset={8}
          style={{
            background: '#fff',
            border: '1px solid #ccc',
            padding: '16px',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
          }}
        >
          <Popover.Arrow data-testid="popover-arrow" />
          <h3 data-testid="popover-title">Popover Header</h3>
          <p>Non-modal popover content</p>
          <input data-testid="popover-input" placeholder="Type here" />
          <Popover.Close data-testid="btn-popover-close">
            Close Popover
          </Popover.Close>
        </Popover.Content>
      </Popover>

      <button type="button" data-testid="btn-outside">
        Outside Button
      </button>
    </div>
  )
}

function HoverGraceFixture() {
  const [open, setOpen] = React.useState(false)
  const [log, setLog] = React.useState<string[]>([])

  return (
    <div data-testid="popover-fixture-root" style={{ padding: 80 }}>
      <pre data-testid="hover-log">{log.join(',')}</pre>
      <button type="button" data-testid="hover-before" style={{ display: 'block', marginBottom: 16 }}>
        Before
      </button>
      <Popover
        open={open}
        openOnHover
        openDelay={50}
        closeDelay={200}
        onOpen={() => {
          setLog(prev => [...prev, 'open'])
          setOpen(true)
        }}
        onDismiss={() => {
          setLog(prev => [...prev, 'dismiss'])
          setOpen(false)
        }}
      >
        <Popover.Trigger
          data-testid="hover-trigger"
          style={{ width: 120, height: 32 }}
        >
          Hover
        </Popover.Trigger>
        <Popover.Content
          data-testid="hover-content"
          placement="bottom"
          offset={48}
          style={{
            width: 220,
            padding: 16,
            background: '#fff',
            border: '1px solid #ccc',
            borderRadius: 4,
          }}
        >
          <button type="button" data-testid="hover-content-btn">
            Inside
          </button>
        </Popover.Content>
      </Popover>
      <button type="button" data-testid="hover-away" style={{ marginLeft: 280, marginTop: 8 }}>
        Away
      </button>
    </div>
  )
}

function NestedLayerFixture() {
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [liveCount, setLiveCount] = React.useState(0)

  React.useEffect(() => {
    const sync = () => {
      setLiveCount(overlayStackStore.getState().layers.filter(layer => layer.open).length)
    }
    sync()
    return overlayStackStore.subscribe(sync)
  }, [])

  return (
    <div data-testid="popover-fixture-root" style={{ padding: 32 }}>
      <div data-testid="overlay-live-count">{liveCount}</div>
      <Overlay open={dialogOpen} onOpenChange={setDialogOpen}>
        <Overlay.Trigger data-testid="dialog-trigger">Open dialog</Overlay.Trigger>
        <Overlay.Content
          data-testid="dialog-content"
          role="dialog"
          style={{
            position: 'fixed',
            top: '30%',
            left: '30%',
            background: '#fff',
            padding: 24,
            border: '1px solid #ccc',
            minWidth: 280,
          }}
        >
          <Popover>
            <Popover.Trigger data-testid="nested-popover-trigger">
              Open popover
            </Popover.Trigger>
            <Popover.Content
              data-testid="nested-popover-content"
              placement="bottom-start"
              offset={8}
              style={{
                background: '#fff',
                border: '1px solid #ccc',
                padding: 12,
              }}
            >
              Nested popover
            </Popover.Content>
          </Popover>
        </Overlay.Content>
      </Overlay>
    </div>
  )
}

