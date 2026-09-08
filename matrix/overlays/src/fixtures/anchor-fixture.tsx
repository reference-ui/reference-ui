import * as React from 'react'
import { Overlay } from '@reference-ui/lib'

export function AnchorFixture() {
  // 1. OV-POS-02: Frozen defaults from anchor
  const [openDefaults, setOpenDefaults] = React.useState(false)
  const anchorDefaultsRef = React.useRef<HTMLButtonElement | null>(null)

  // 2. OV-POS-03: Flip & shift near viewport bottom edge
  const [openFlipShift, setOpenFlipShift] = React.useState(false)
  const [openNoFlipNoShift, setOpenNoFlipNoShift] = React.useState(false)
  const anchorEdgeRef = React.useRef<HTMLButtonElement | null>(null)

  // 3. OV-POS-04: Explicit offset, collisionPadding, and strategy="fixed"
  const [openCustomGeom, setOpenCustomGeom] = React.useState(false)
  const anchorCustomRef = React.useRef<HTMLButtonElement | null>(null)

  // 4. OV-POS-05: Arrow participation & edgePadding
  const [openArrowDefault, setOpenArrowDefault] = React.useState(false)
  const [openArrowCustom, setOpenArrowCustom] = React.useState(false)
  const anchorArrowRef = React.useRef<HTMLButtonElement | null>(null)

  return (
    <div data-testid="anchor-fixture-root" style={{ padding: 24, minHeight: '200vh' }}>
      <h2>Anchored Floating UI Geometry Fixtures</h2>

      {/* 1. OV-POS-02: Default frozen positioning */}
      <section data-testid="section-pos-02" style={{ marginBottom: 48 }}>
        <h3>OV-POS-02: Default Frozen Positioning</h3>
        <button
          type="button"
          ref={anchorDefaultsRef}
          data-testid="anchor-target-defaults"
          style={{ width: 120, height: 40, marginTop: 40, marginLeft: 60 }}
          onClick={() => setOpenDefaults(true)}
        >
          Anchor Defaults Target
        </button>
        <Overlay
          open={openDefaults}
          onOpenChange={setOpenDefaults}
          anchor={anchorDefaultsRef}
          isolation={false}
        >
          <Overlay.Content
            data-testid="content-pos-defaults"
            style={{ width: 200, height: 100, background: '#e0e7ff', padding: 12 }}
          >
            <p>Defaults Content</p>
            <button
              type="button"
              data-testid="btn-close-pos-defaults"
              onClick={() => setOpenDefaults(false)}
            >
              Close
            </button>
          </Overlay.Content>
        </Overlay>
      </section>

      {/* 2. OV-POS-03: Flip & Shift */}
      <section data-testid="section-pos-03" style={{ marginBottom: 48 }}>
        <h3>OV-POS-03: Flip and Shift</h3>
        {/* Placed close to the bottom and right of initial viewport (y: 680, viewport is 720) */}
        <button
          type="button"
          ref={anchorEdgeRef}
          data-testid="anchor-target-edge"
          style={{
            position: 'absolute',
            top: 680,
            left: 1100,
            width: 140,
            height: 36,
          }}
          onClick={() => {
            setOpenFlipShift(true)
            setOpenNoFlipNoShift(false)
          }}
        >
          Anchor Edge Target
        </button>

        {/* Enabled flip and shift */}
        <Overlay
          open={openFlipShift}
          onOpenChange={setOpenFlipShift}
          anchor={anchorEdgeRef}
          isolation={false}
        >
          <Overlay.Content
            data-testid="content-flip-shift-enabled"
            placement="bottom"
            flip={true}
            shift={true}
            style={{ width: 250, height: 120, background: '#dcfce7', padding: 12 }}
          >
            <p>Flip & Shift Enabled</p>
            <button
              type="button"
              data-testid="btn-close-flip-shift"
              onClick={() => setOpenFlipShift(false)}
            >
              Close
            </button>
          </Overlay.Content>
        </Overlay>

        {/* Disabled flip and shift */}
        <Overlay
          open={openNoFlipNoShift}
          onOpenChange={setOpenNoFlipNoShift}
          anchor={anchorEdgeRef}
          isolation={false}
        >
          <Overlay.Content
            data-testid="content-flip-shift-disabled"
            placement="bottom"
            flip={false}
            shift={false}
            style={{ width: 250, height: 120, background: '#fee2e2', padding: 12 }}
          >
            <p>Flip & Shift Disabled</p>
            <button
              type="button"
              data-testid="btn-close-no-flip-shift"
              onClick={() => setOpenNoFlipNoShift(false)}
            >
              Close
            </button>
          </Overlay.Content>
        </Overlay>

        <button
          type="button"
          data-testid="btn-open-no-flip-no-shift"
          style={{ position: 'absolute', top: 680, left: 900 }}
          onClick={() => {
            setOpenNoFlipNoShift(true)
            setOpenFlipShift(false)
          }}
        >
          Open Disabled Flip/Shift
        </button>
      </section>

      {/* 3. OV-POS-04: Explicit offset, collisionPadding, strategy="fixed" */}
      <section data-testid="section-pos-04" style={{ marginTop: 200, marginBottom: 48 }}>
        <h3>OV-POS-04: Custom Geometry Options</h3>
        <button
          type="button"
          ref={anchorCustomRef}
          data-testid="anchor-target-custom"
          style={{ width: 100, height: 40 }}
          onClick={() => setOpenCustomGeom(true)}
        >
          Anchor Custom
        </button>
        <Overlay
          open={openCustomGeom}
          onOpenChange={setOpenCustomGeom}
          anchor={anchorCustomRef}
          isolation={false}
        >
          <Overlay.Content
            data-testid="content-pos-custom"
            strategy="fixed"
            offset={24}
            collisionPadding={16}
            placement="bottom-start"
            style={{
              width: 180,
              height: 80,
              background: '#fef3c7',
              padding: 12,
              transform: 'scale(1.05)',
            }}
          >
            <p>Fixed Strategy Content</p>
            <button
              type="button"
              data-testid="btn-close-pos-custom"
              onClick={() => setOpenCustomGeom(false)}
            >
              Close
            </button>
          </Overlay.Content>
        </Overlay>
      </section>

      {/* 4. OV-POS-05: Arrow Participation & edgePadding */}
      <section data-testid="section-pos-05" style={{ marginBottom: 48 }}>
        <h3>OV-POS-05: Arrow Position and edgePadding</h3>
        <button
          type="button"
          ref={anchorArrowRef}
          data-testid="anchor-target-arrow"
          style={{ width: 140, height: 40, marginLeft: 150 }}
          onClick={() => setOpenArrowDefault(true)}
        >
          Anchor Arrow Target
        </button>
        <button
          type="button"
          data-testid="btn-open-arrow-custom"
          style={{ marginLeft: 12 }}
          onClick={() => setOpenArrowCustom(true)}
        >
          Open Arrow Custom
        </button>

        {/* Default edgePadding=4 */}
        <Overlay
          open={openArrowDefault}
          onOpenChange={setOpenArrowDefault}
          anchor={anchorArrowRef}
          isolation={false}
        >
          <Overlay.Content
            data-testid="content-arrow-default"
            placement="bottom-start"
            style={{ width: 220, height: 90, background: '#f3e8ff', padding: 12 }}
          >
            <Overlay.Arrow data-testid="arrow-default" edgePadding={4} style={{ width: 12, height: 12, background: '#a855f7' }} />
            <p>Arrow Default Padding</p>
            <button
              type="button"
              data-testid="btn-close-arrow-default"
              onClick={() => setOpenArrowDefault(false)}
            >
              Close
            </button>
          </Overlay.Content>
        </Overlay>

        {/* Custom edgePadding=16 */}
        <Overlay
          open={openArrowCustom}
          onOpenChange={setOpenArrowCustom}
          anchor={anchorArrowRef}
          isolation={false}
        >
          <Overlay.Content
            data-testid="content-arrow-custom"
            placement="bottom-start"
            style={{ width: 220, height: 90, background: '#fce7f3', padding: 12 }}
          >
            <Overlay.Arrow data-testid="arrow-custom" edgePadding={16} style={{ width: 12, height: 12, background: '#ec4899' }} />
            <p>Arrow Custom Padding</p>
            <button
              type="button"
              data-testid="btn-close-arrow-custom"
              onClick={() => setOpenArrowCustom(false)}
            >
              Close
            </button>
          </Overlay.Content>
        </Overlay>
      </section>
    </div>
  )
}
