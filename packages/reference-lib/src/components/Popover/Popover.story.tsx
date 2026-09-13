import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { ReferenceLibrary } from '../ReferenceLibrary'
import { Overlay, overlayStackStore } from '../Overlay'
import { Popover } from './index'

export const Basic = () => {
  const [open, setOpen] = React.useState(false)
  return (
    <ReferenceLibrary>
      <Div p="4r" colorMode="dark" data-testid="popover-fixture-root">
        <Popover open={open} onOpenChange={setOpen}>
          <Popover.Trigger data-testid="btn-popover-trigger" variant="primary">
            Open Popover
          </Popover.Trigger>
          <Popover.Content
            data-testid="popover-content"
            placement="bottom-start"
            offset={8}
            p="4r"
            bg="ui.dialog.background"
            color="ui.dialog.foreground"
            borderRadius="md"
            border="1px solid"
            borderColor="ui.dialog.border"
            boxShadow="0 4px 12px rgba(0,0,0,0.15)"
            zIndex={1000}
          >
            <Popover.Arrow data-testid="popover-arrow" />
            <h3 data-testid="popover-title" style={{ margin: '0 0 8px 0' }}>Popover Header</h3>
            <p style={{ margin: '0 0 8px 0' }}>Non-modal popover content</p>
            <input data-testid="popover-input" placeholder="Type here" style={{ marginBottom: 8 }} />
            <div>
              <Popover.Close data-testid="btn-popover-close">
                Close Popover
              </Popover.Close>
            </div>
          </Popover.Content>
        </Popover>
        <button type="button" data-testid="btn-outside" style={{ marginLeft: 16 }}>
          Outside Button
        </button>
      </Div>
    </ReferenceLibrary>
  )
}

export const ClickToOpen = () => (
  <ReferenceLibrary>
    <Div p="4r" colorMode="dark" data-testid="popover-fixture-root">
      <Popover>
        <Popover.Trigger variant="primary">Open popover</Popover.Trigger>
        <Popover.Content
          p="3.5r"
          bg="ui.dialog.background"
          color="ui.dialog.foreground"
          borderRadius="md"
          border="1px solid"
          borderColor="ui.dialog.border"
          placement="bottom-start"
          offset={8}
        >
          <Span fontWeight="600" fontSize="3.5r">
            Popover title
          </Span>
          <Popover.Arrow />
        </Popover.Content>
      </Popover>
    </Div>
  </ReferenceLibrary>
)

export const HoverCard = () => (
  <ReferenceLibrary>
    <Div p="4r" colorMode="dark" data-testid="popover-fixture-root">
      <Popover openOnHover openDelay={300} closeDelay={200}>
        <Popover.Trigger variant="primary">Hover for preview</Popover.Trigger>
        <Popover.Content
          p="3r"
          bg="ui.dialog.background"
          borderRadius="md"
          border="1px solid"
          borderColor="ui.dialog.border"
          placement="top"
          maxW="50r"
        >
          <Span fontSize="3r">Hover-opened popover with grace area for pointer travel.</Span>
          <Popover.Arrow />
        </Popover.Content>
      </Popover>
    </Div>
  </ReferenceLibrary>
)

export const Placements = () => (
  <ReferenceLibrary>
    <div data-testid="popover-fixture-root">
      <Div display="grid" gridTemplateColumns="repeat(2, 1fr)" gap="6r" p="8r" colorMode="dark">
        {(['top', 'right', 'bottom', 'left'] as const).map(placement => (
          <Popover key={placement}>
            <Popover.Trigger variant="primary">
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
  </ReferenceLibrary>
)

export const HoverGrace = () => {
  const [open, setOpen] = React.useState(false)
  const [log, setLog] = React.useState<string[]>([])

  return (
    <ReferenceLibrary>
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
              background: '#222',
              color: '#fff',
              border: '1px solid #555',
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
    </ReferenceLibrary>
  )
}

export const NestedLayer = () => {
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
    <ReferenceLibrary>
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
              background: '#222',
              color: '#fff',
              padding: 24,
              border: '1px solid #555',
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
                  background: '#333',
                  color: '#fff',
                  border: '1px solid #666',
                  padding: 12,
                }}
              >
                Nested popover
              </Popover.Content>
            </Popover>
          </Overlay.Content>
        </Overlay>
      </div>
    </ReferenceLibrary>
  )
}
