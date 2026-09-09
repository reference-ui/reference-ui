import * as React from 'react'
import { Overlay, Tooltip, ReferenceLibrary } from '@reference-ui/lib'

const tipStyle: React.CSSProperties = {
  background: '#333',
  color: '#fff',
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  zIndex: 1000,
}

export function TooltipFixture() {
  const fixture =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('fixture') : null

  if (fixture === 'Group') return <GroupFixture />
  if (fixture === 'NestedOverlay') return <NestedOverlayFixture />
  if (fixture === 'Scroll') return <ScrollFixture />

  return (
    <ReferenceLibrary>
      <div data-testid="tooltip-fixture-root">
        <h1>Tooltip Fixture</h1>

        <div style={{ display: 'flex', gap: '24px', margin: '80px 0 24px' }}>
          <Tooltip openDelay={0} closeDelay={0}>
            <Tooltip.Trigger>
              <button type="button" data-testid="btn-tooltip-a">
                Button A
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content data-testid="tooltip-content-a" placement="top" style={tipStyle}>
              Help text for Button A
            </Tooltip.Content>
          </Tooltip>

          <Tooltip openDelay={0} closeDelay={0}>
            <Tooltip.Trigger>
              <button type="button" data-testid="btn-tooltip-b">
                Button B
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content data-testid="tooltip-content-b" placement="top" style={tipStyle}>
              Help text for Button B
            </Tooltip.Content>
          </Tooltip>
        </div>

        <button type="button" data-testid="btn-outside">
          Outside Control
        </button>
      </div>
    </ReferenceLibrary>
  )
}

function GroupFixture() {
  return (
    <ReferenceLibrary tooltip={{ skipDelay: 300 }}>
      <div data-testid="tooltip-fixture-root" style={{ padding: 80 }}>
        <div style={{ display: 'flex', gap: 32 }}>
          <Tooltip openDelay={200} closeDelay={50}>
            <Tooltip.Trigger>
              <button type="button" data-testid="btn-group-a">
                Group A
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content data-testid="tooltip-group-a" placement="top" style={tipStyle}>
              Tip A
            </Tooltip.Content>
          </Tooltip>
          <Tooltip openDelay={200} closeDelay={50}>
            <Tooltip.Trigger>
              <button type="button" data-testid="btn-group-b">
                Group B
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content data-testid="tooltip-group-b" placement="top" style={tipStyle}>
              Tip B
            </Tooltip.Content>
          </Tooltip>
        </div>
        <button type="button" data-testid="btn-group-away" style={{ marginTop: 40 }}>
          Away
        </button>
      </div>
    </ReferenceLibrary>
  )
}

function NestedOverlayFixture() {
  const [open, setOpen] = React.useState(false)

  return (
    <ReferenceLibrary>
      <div data-testid="tooltip-fixture-root" style={{ padding: 32 }}>
        <Overlay open={open} onOpenChange={setOpen}>
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
            <p>Parent overlay</p>
            <Tooltip openDelay={0} closeDelay={0}>
              <Tooltip.Trigger>
                <button type="button" data-testid="nested-tooltip-trigger">
                  Nested tip
                </button>
              </Tooltip.Trigger>
              <Tooltip.Content data-testid="nested-tooltip-content" placement="top" style={tipStyle}>
                Nested tooltip
              </Tooltip.Content>
            </Tooltip>
          </Overlay.Content>
        </Overlay>
      </div>
    </ReferenceLibrary>
  )
}

function ScrollFixture() {
  return (
    <ReferenceLibrary>
      <div data-testid="tooltip-fixture-root" style={{ padding: 24 }}>
        <div
          data-testid="tooltip-scroll-ancestor"
          style={{
            height: 160,
            width: 280,
            overflow: 'auto',
            border: '1px solid #ccc',
            marginBottom: 24,
          }}
        >
          <div style={{ height: 80 }} />
          <Tooltip openDelay={0} closeDelay={0}>
            <Tooltip.Trigger>
              <button type="button" data-testid="btn-scroll-tooltip">
                Scroll tip
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content data-testid="tooltip-scroll-content" placement="top" style={tipStyle}>
              Closes on ancestor scroll
            </Tooltip.Content>
          </Tooltip>
          <div style={{ height: 240 }} />
        </div>

        <Tooltip openDelay={0} closeDelay={0}>
          <Tooltip.Trigger>
            <textarea
              data-testid="tooltip-textarea"
              defaultValue={'line 1\nline 2\nline 3\nline 4\nline 5\nline 6\nline 7\nline 8'}
              style={{ height: 64, width: 220 }}
            />
          </Tooltip.Trigger>
          <Tooltip.Content data-testid="tooltip-textarea-content" placement="top" style={tipStyle}>
            Stays on field scroll
          </Tooltip.Content>
        </Tooltip>
      </div>
    </ReferenceLibrary>
  )
}
