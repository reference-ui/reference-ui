import * as React from 'react'
import { Overlay } from '@reference-ui/lib'

export function ScrollFixture() {
  const [open, setOpen] = React.useState(false)
  const [openScrollFalse, setOpenScrollFalse] = React.useState(false)
  const [openFocusFalse, setOpenFocusFalse] = React.useState(false)
  const [openIosEdgeScrollFalse, setOpenIosEdgeScrollFalse] = React.useState(false)
  const [openIosEdgeScrollTrue, setOpenIosEdgeScrollTrue] = React.useState(false)
  const [openIosUnboundScrollTrue, setOpenIosUnboundScrollTrue] = React.useState(false)
  const [openShardScroll, setOpenShardScroll] = React.useState(false)
  const [openShardChild, setOpenShardChild] = React.useState(false)

  return (
    <div data-testid="scroll-fixture-root" style={{ minHeight: '300vh', position: 'relative' }}>
      <h2>Scroll Lock & Viewport Fixtures</h2>
      <p>This page is 300vh tall to test scroll position preservation.</p>

      {/* Button placed at scroll offset 240px */}
      <button
        type="button"
        data-testid="btn-open-at-scroll"
        style={{ position: 'absolute', top: 240, left: 24 }}
        onClick={() => setOpen(true)}
      >
        Open Dialog at Y=240
      </button>

      {/* Outside button for isolation tests */}
      <div style={{ padding: '16px 24px' }}>
        <button
          type="button"
          data-testid="btn-iso-outside"
          onClick={() => {}}
        >
          Outside Reference Button
        </button>

        <button
          type="button"
          data-testid="btn-open-iso-scroll-false"
          onClick={() => setOpenScrollFalse(true)}
        >
          Open isolation scroll=false
        </button>

        <button
          type="button"
          data-testid="btn-open-iso-focus-false"
          onClick={() => setOpenFocusFalse(true)}
        >
          Open isolation focus=false, inert=true, scroll=true
        </button>

        <button
          type="button"
          data-testid="btn-open-ios-edge-scroll-false"
          onClick={() => setOpenIosEdgeScrollFalse(true)}
        >
          Open iOS Edge scroll=false
        </button>

        <button
          type="button"
          data-testid="btn-open-ios-edge-scroll-true"
          onClick={() => setOpenIosEdgeScrollTrue(true)}
        >
          Open iOS Edge scroll=true
        </button>

        <button
          type="button"
          data-testid="btn-open-ios-unbound-scroll-true"
          onClick={() => setOpenIosUnboundScrollTrue(true)}
        >
          Open iOS Unbound scroll=true
        </button>
      </div>

      {/* Primary Scroll Dialog */}
      <Overlay open={open} onOpenChange={setOpen}>
        <Overlay.Backdrop
          data-testid="scroll-backdrop"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }}
        />
        <Overlay.Content
          data-testid="scroll-content"
          role="dialog"
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#fff',
            padding: 24,
            borderRadius: 8,
            width: 320,
            zIndex: 1001,
          }}
        >
          <h3>Scrollable Overlay</h3>
          <p>Inner scroll container below:</p>

          <div
            data-testid="scrollable-content-inner"
            style={{
              maxHeight: 120,
              overflowY: 'auto',
              border: '1px solid #ddd',
              padding: 8,
              marginTop: 12,
            }}
          >
            <p>Inner line 1</p>
            <p>Inner line 2</p>
            <p>Inner line 3</p>
            <p>Inner line 4</p>
            <p>Inner line 5</p>
            <p>Inner line 6</p>
            <p>Inner line 7</p>
            <p>Inner line 8</p>
            <p>Inner line 9</p>
            <p>Inner line 10</p>
          </div>

          <div style={{ marginTop: 16 }}>
            <button
              type="button"
              data-testid="btn-close-scroll-dialog"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
        </Overlay.Content>
      </Overlay>

      {/* OV-ISO-03: isolation={{ scroll: false }} (focus: true, inert: true, scroll: false) */}
      <Overlay
        open={openScrollFalse}
        onOpenChange={setOpenScrollFalse}
        isolation={{ scroll: false }}
      >
        <Overlay.Backdrop data-testid="iso-scroll-false-backdrop" />
        <Overlay.Content
          data-testid="iso-scroll-false-content"
          role="dialog"
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#fff',
            padding: 20,
            zIndex: 1000,
          }}
        >
          <h3>Isolation: scroll=false</h3>
          <button type="button" data-testid="btn-iso-scroll-false-1">
            Inside 1
          </button>
          <button type="button" data-testid="btn-iso-scroll-false-2">
            Inside 2
          </button>
          <button
            type="button"
            data-testid="btn-close-iso-scroll-false"
            onClick={() => setOpenScrollFalse(false)}
          >
            Close
          </button>
        </Overlay.Content>
      </Overlay>

      {/* OV-ISO-03: isolation={{ focus: false, inert: true, scroll: true }} */}
      <Overlay
        open={openFocusFalse}
        onOpenChange={setOpenFocusFalse}
        isolation={{ focus: false, inert: true, scroll: true }}
      >
        <Overlay.Backdrop data-testid="iso-focus-false-backdrop" />
        <Overlay.Content
          data-testid="iso-focus-false-content"
          role="dialog"
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#fff',
            padding: 20,
            zIndex: 1000,
          }}
        >
          <h3>Isolation: focus=false, inert=true, scroll=true</h3>
          <button type="button" data-testid="btn-iso-focus-false-1">
            Inside Focus False
          </button>
          <button
            type="button"
            data-testid="btn-close-iso-focus-false"
            onClick={() => setOpenFocusFalse(false)}
          >
            Close
          </button>
        </Overlay.Content>
      </Overlay>

      {/* OV-ISO-03: iOS edge with scroll=false */}
      <Overlay
        open={openIosEdgeScrollFalse}
        onOpenChange={setOpenIosEdgeScrollFalse}
        edge="bottom"
        isolation={{ scroll: false }}
      >
        <Overlay.Content
          data-testid="ios-edge-scroll-false-content"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: 150,
            background: '#fff',
            zIndex: 1000,
          }}
        >
          <button
            type="button"
            data-testid="btn-close-ios-edge-scroll-false"
            onClick={() => setOpenIosEdgeScrollFalse(false)}
          >
            Close
          </button>
        </Overlay.Content>
      </Overlay>

      {/* OV-ISO-03: iOS edge with scroll=true */}
      <Overlay
        open={openIosEdgeScrollTrue}
        onOpenChange={setOpenIosEdgeScrollTrue}
        edge="bottom"
        isolation={{ focus: false, inert: true, scroll: true }}
      >
        <Overlay.Content
          data-testid="ios-edge-scroll-true-content"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: 150,
            background: '#fff',
            zIndex: 1000,
          }}
        >
          <button
            type="button"
            data-testid="btn-close-ios-edge-scroll-true"
            onClick={() => setOpenIosEdgeScrollTrue(false)}
          >
            Close
          </button>
        </Overlay.Content>
      </Overlay>

      {/* OV-ISO-03: iOS unbound with scroll=true */}
      <Overlay
        open={openIosUnboundScrollTrue}
        onOpenChange={setOpenIosUnboundScrollTrue}
        isolation={{ scroll: true }}
      >
        <Overlay.Content
          data-testid="ios-unbound-scroll-true-content"
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            background: '#fff',
            zIndex: 1000,
          }}
        >
          <button
            type="button"
            data-testid="btn-close-ios-unbound-scroll-true"
            onClick={() => setOpenIosUnboundScrollTrue(false)}
          >
            Close
          </button>
        </Overlay.Content>
      </Overlay>

      {/* OV-SCROLL-04: Edge-aware scrolling in a registered portalled shard */}
      <section data-testid="section-ov-scroll-04" style={{ marginTop: 280 }}>
        <h3>OV-SCROLL-04: Portalled shard scrolling</h3>
        <button
          type="button"
          data-testid="btn-open-shard-scroll"
          onClick={() => setOpenShardScroll(true)}
        >
          Open Shard Scroll Parent
        </button>
        <div
          data-testid="bg-scroller-unregistered"
          style={{
            marginTop: 12,
            height: 80,
            overflowY: 'auto',
            border: '1px solid #ccc',
            width: 240,
          }}
        >
          <div style={{ height: 240, padding: 8 }}>Unregistered background scroller</div>
        </div>
        <Overlay open={openShardScroll} onOpenChange={setOpenShardScroll}>
          <Overlay.Backdrop
            data-testid="shard-scroll-parent-backdrop"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000 }}
          />
          <Overlay.Content
            data-testid="shard-scroll-parent-content"
            role="dialog"
            style={{
              position: 'fixed',
              top: '20%',
              left: '20%',
              background: '#fff',
              padding: 16,
              zIndex: 1001,
            }}
          >
            <p>Parent with portalled child shard</p>
            <button
              type="button"
              data-testid="btn-open-shard-scroll-child"
              onClick={() => setOpenShardChild(true)}
            >
              Open Portalled Scroll Child
            </button>
            <button
              type="button"
              data-testid="btn-close-shard-scroll-parent"
              onClick={() => {
                setOpenShardChild(false)
                setOpenShardScroll(false)
              }}
            >
              Close Parent
            </button>
            <Overlay open={openShardChild} onOpenChange={setOpenShardChild}>
              <Overlay.Content
                data-testid="shard-scroll-child-content"
                style={{
                  position: 'fixed',
                  top: '40%',
                  left: '40%',
                  background: '#e0f2fe',
                  padding: 16,
                  zIndex: 1005,
                }}
              >
                <p>Portalled shard scroller</p>
                <div
                  data-testid="shard-scroll-inner"
                  style={{
                    maxHeight: 100,
                    overflowY: 'auto',
                    border: '1px solid #7dd3fc',
                    width: 200,
                  }}
                >
                  <div style={{ height: 400, padding: 8 }}>
                    <p>Shard line 1</p>
                    <p>Shard line 2</p>
                    <p>Shard line 3</p>
                    <p>Shard line 4</p>
                    <p>Shard line 5</p>
                    <p>Shard line 6</p>
                    <p>Shard line 7</p>
                    <p>Shard line 8</p>
                  </div>
                </div>
                <button
                  type="button"
                  data-testid="btn-close-shard-scroll-child"
                  onClick={() => setOpenShardChild(false)}
                >
                  Close Child
                </button>
              </Overlay.Content>
            </Overlay>
          </Overlay.Content>
        </Overlay>
      </section>
    </div>
  )
}
