import * as React from 'react'
import { Overlay } from '@reference-ui/lib'

const exitStyle: React.CSSProperties = {
  position: 'fixed',
  top: '22%',
  left: '22%',
  background: '#fff',
  padding: 16,
  minWidth: 280,
  border: '1px solid #333',
  transition: 'opacity 180ms ease',
}

export function FocusLockOverlayFixture() {
  const [openPresence, setOpenPresence] = React.useState(false)
  const [openSkip, setOpenSkip] = React.useState(false)
  const [openExplicit, setOpenExplicit] = React.useState(false)
  const explicitRef = React.useRef<HTMLButtonElement | null>(null)

  const [openRight, setOpenRight] = React.useState(false)
  const [rightGone, setRightGone] = React.useState(false)

  const [openLeft, setOpenLeft] = React.useState(false)
  const [leftGone, setLeftGone] = React.useState(false)

  const [openAncestor, setOpenAncestor] = React.useState(false)
  const [ancestorOpenerGone, setAncestorOpenerGone] = React.useState(false)

  const [openDisabled, setOpenDisabled] = React.useState(false)
  const [openerDisabled, setOpenerDisabled] = React.useState(false)

  const [openParent, setOpenParent] = React.useState(false)
  const [openChild, setOpenChild] = React.useState(false)

  const [openShardParent, setOpenShardParent] = React.useState(false)
  const [openShardChild, setOpenShardChild] = React.useState(false)

  return (
    <div data-testid="focus-lock-overlay-root" style={{ padding: 16 }}>
      <style>{`
        .fl-ov-content[data-state="closed"],
        .fl-ov-backdrop[data-state="closed"] { opacity: 0; }
        .fl-ov-content[data-state="open"],
        .fl-ov-backdrop[data-state="open"] { opacity: 1; }
      `}</style>

      <h2>FocusLock × Overlay</h2>
      <button type="button" data-testid="fl-ov-background">
        Background control
      </button>
      <button type="button" ref={explicitRef} data-testid="fl-ov-explicit-target" style={{ marginLeft: 8 }}>
        Explicit restore
      </button>

      <section data-testid="section-fl-ov-presence" style={{ marginTop: 24 }}>
        <h3>FL-OV-01 / FL-OV-02 Presence coupling</h3>
        <Overlay
          open={openPresence}
          onOpenChange={setOpenPresence}
          isolation={{ focus: true, inert: false, scroll: false }}
        >
          <Overlay.Trigger data-testid="fl-ov-01-trigger">Open presence lock</Overlay.Trigger>
          <Overlay.Backdrop
            className="fl-ov-backdrop"
            data-testid="fl-ov-01-backdrop"
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.2)',
              transition: 'opacity 180ms ease',
              pointerEvents: 'none',
            }}
          />
          <Overlay.Content
            className="fl-ov-content"
            data-testid="fl-ov-01-content"
            style={{ ...exitStyle, transition: 'opacity 180ms ease' }}
          >
            <button type="button" data-testid="fl-ov-01-first">First</button>
            <button type="button" data-testid="fl-ov-01-second">Second</button>
            <button type="button" data-testid="fl-ov-01-close" onClick={() => setOpenPresence(false)}>
              Close
            </button>
          </Overlay.Content>
        </Overlay>

        <Overlay
          open={openSkip}
          onOpenChange={setOpenSkip}
          isolation={{ focus: true, inert: false, scroll: false }}
        >
          <Overlay.Trigger data-testid="fl-ov-skip-trigger">Open skip restore</Overlay.Trigger>
          <Overlay.Content
            className="fl-ov-content"
            data-testid="fl-ov-skip-content"
            restoreFocus={false}
            style={{ ...exitStyle, top: '48%' }}
          >
            <button
              type="button"
              data-testid="fl-ov-skip-close"
              onClick={() => setOpenSkip(false)}
            >
              Close without restore
            </button>
          </Overlay.Content>
        </Overlay>

        <Overlay
          open={openExplicit}
          onOpenChange={setOpenExplicit}
          isolation={{ focus: true, inert: false, scroll: false }}
        >
          <Overlay.Trigger data-testid="fl-ov-explicit-trigger">Open explicit restore</Overlay.Trigger>
          <Overlay.Content
            className="fl-ov-content"
            data-testid="fl-ov-explicit-content"
            restoreFocus={explicitRef}
            style={{ ...exitStyle, top: '62%' }}
          >
            <button type="button" data-testid="fl-ov-explicit-inner">Inner</button>
            <button type="button" data-testid="fl-ov-explicit-close" onClick={() => setOpenExplicit(false)}>
              Close to explicit
            </button>
          </Overlay.Content>
        </Overlay>
      </section>

      <section data-testid="section-fl-ov-proximity" style={{ marginTop: 24 }}>
        <h3>FL-OV-05 proximity</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {!rightGone && (
            <button type="button" data-testid="fl-ov-right-opener" onClick={() => setOpenRight(true)}>
              Right opener
            </button>
          )}
          <button type="button" data-testid="fl-ov-right-sibling">Right sibling</button>
        </div>
        <Overlay open={openRight} onOpenChange={setOpenRight} isolation={{ focus: true, inert: false, scroll: false }}>
          <Overlay.Content className="fl-ov-content" data-testid="fl-ov-right-content" style={exitStyle}>
            <button
              type="button"
              data-testid="fl-ov-right-remove-close"
              onClick={() => {
                setRightGone(true)
                setOpenRight(false)
              }}
            >
              Remove opener and close
            </button>
          </Overlay.Content>
        </Overlay>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
          <button type="button" data-testid="fl-ov-left-sibling">Left sibling</button>
          {!leftGone && (
            <button type="button" data-testid="fl-ov-left-opener" onClick={() => setOpenLeft(true)}>
              Left opener
            </button>
          )}
        </div>
        <Overlay open={openLeft} onOpenChange={setOpenLeft} isolation={{ focus: true, inert: false, scroll: false }}>
          <Overlay.Content className="fl-ov-content" data-testid="fl-ov-left-content" style={exitStyle}>
            <button
              type="button"
              data-testid="fl-ov-left-remove-close"
              onClick={() => {
                setLeftGone(true)
                setOpenLeft(false)
              }}
            >
              Remove opener and close
            </button>
          </Overlay.Content>
        </Overlay>

        <div
          tabIndex={0}
          data-testid="fl-ov-ancestor"
          style={{ marginTop: 12, padding: 8, border: '1px dashed #888' }}
        >
          Ancestor
          <span>
            {!ancestorOpenerGone && (
              <button
                type="button"
                data-testid="fl-ov-ancestor-opener"
                onClick={() => setOpenAncestor(true)}
              >
                Ancestor opener
              </button>
            )}
          </span>
        </div>
        <Overlay open={openAncestor} onOpenChange={setOpenAncestor} isolation={{ focus: true, inert: false, scroll: false }}>
          <Overlay.Content className="fl-ov-content" data-testid="fl-ov-ancestor-content" style={exitStyle}>
            <button
              type="button"
              data-testid="fl-ov-ancestor-remove-close"
              onClick={() => {
                setAncestorOpenerGone(true)
                setOpenAncestor(false)
              }}
            >
              Remove opener and close
            </button>
          </Overlay.Content>
        </Overlay>

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button
            type="button"
            data-testid="fl-ov-disabled-opener"
            disabled={openerDisabled}
            onClick={() => setOpenDisabled(true)}
          >
            Disable opener
          </button>
          <button type="button" data-testid="fl-ov-disabled-sibling">Disable sibling</button>
        </div>
        <Overlay open={openDisabled} onOpenChange={setOpenDisabled} isolation={{ focus: true, inert: false, scroll: false }}>
          <Overlay.Content className="fl-ov-content" data-testid="fl-ov-disabled-content" style={exitStyle}>
            <button
              type="button"
              data-testid="fl-ov-disabled-close"
              onClick={() => {
                setOpenerDisabled(true)
                setOpenDisabled(false)
              }}
            >
              Disable opener and close
            </button>
          </Overlay.Content>
        </Overlay>
      </section>

      <section data-testid="section-fl-ov-nest" style={{ marginTop: 24 }}>
        <h3>FL-OV-03 nested isolating</h3>
        <button type="button" data-testid="fl-ov-nest-open-parent" onClick={() => setOpenParent(true)}>
          Open parent modal
        </button>
        <Overlay open={openParent} onOpenChange={setOpenParent}>
          <Overlay.Backdrop className="fl-ov-backdrop" data-testid="fl-ov-nest-parent-backdrop" />
          <Overlay.Content
            className="fl-ov-content"
            data-testid="fl-ov-nest-parent-content"
            style={{ ...exitStyle, zIndex: 20 }}
          >
            <button type="button" data-testid="fl-ov-nest-parent-1">Parent 1</button>
            <button type="button" data-testid="fl-ov-nest-open-child" onClick={() => setOpenChild(true)}>
              Open child modal
            </button>
            <button type="button" data-testid="fl-ov-nest-parent-2">Parent 2</button>
            <button type="button" data-testid="fl-ov-nest-parent-close" onClick={() => setOpenParent(false)}>
              Close parent
            </button>
          </Overlay.Content>
        </Overlay>
        <Overlay open={openChild} onOpenChange={setOpenChild}>
          <Overlay.Backdrop className="fl-ov-backdrop" data-testid="fl-ov-nest-child-backdrop" />
          <Overlay.Content
            className="fl-ov-content"
            data-testid="fl-ov-nest-child-content"
            style={{ ...exitStyle, top: '40%', left: '40%', background: '#f4f4f4', zIndex: 30 }}
          >
            <button type="button" data-testid="fl-ov-nest-child-1">Child 1</button>
            <button type="button" data-testid="fl-ov-nest-child-2">Child 2</button>
            <button type="button" data-testid="fl-ov-nest-child-close" onClick={() => setOpenChild(false)}>
              Close child
            </button>
          </Overlay.Content>
        </Overlay>
      </section>

      <section data-testid="section-fl-ov-shard" style={{ marginTop: 24 }}>
        <h3>FL-OV-04 modeless portalled shard</h3>
        <button
          type="button"
          data-testid="fl-ov-shard-open-parent"
          onClick={() => setOpenShardParent(true)}
        >
          Open shard parent
        </button>
        <button type="button" data-testid="fl-ov-shard-unregistered">Unregistered sibling</button>
        <Overlay open={openShardParent} onOpenChange={setOpenShardParent}>
          <Overlay.Backdrop data-testid="fl-ov-shard-parent-backdrop" />
          <Overlay.Content data-testid="fl-ov-shard-parent-content" style={{ ...exitStyle, zIndex: 20 }}>
            <button type="button" data-testid="fl-ov-shard-parent-1">Parent 1</button>
            <button
              type="button"
              data-testid="fl-ov-shard-open-child"
              onClick={() => setOpenShardChild(true)}
            >
              Open modeless child
            </button>
            <button type="button" data-testid="fl-ov-shard-parent-2">Parent 2</button>
            <button
              type="button"
              data-testid="fl-ov-shard-parent-close"
              onClick={() => setOpenShardParent(false)}
            >
              Close parent
            </button>
            <Overlay open={openShardChild} onOpenChange={setOpenShardChild} isolation={false}>
              <Overlay.Content
                data-testid="fl-ov-shard-child-content"
                placement="bottom-start"
                offset={0}
                style={{
                  position: 'fixed',
                  top: '46%',
                  left: '46%',
                  background: '#eef',
                  padding: 16,
                  zIndex: 40,
                  border: '1px solid #336',
                }}
              >
                <button type="button" data-testid="fl-ov-shard-child-1">Child 1</button>
                <button type="button" data-testid="fl-ov-shard-child-2">Child 2</button>
                <button
                  type="button"
                  data-testid="fl-ov-shard-child-close"
                  onClick={() => setOpenShardChild(false)}
                >
                  Close child
                </button>
              </Overlay.Content>
            </Overlay>
          </Overlay.Content>
        </Overlay>
      </section>
    </div>
  )
}
