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

  // Step 6: Virtual anchor & closeOnScroll
  const [virtualOpen, setVirtualOpen] = React.useState(false)
  const [virtualPoint, setVirtualPoint] = React.useState<{
    x: number
    y: number
    width?: number
    height?: number
  }>({ x: 300, y: 300 })
  const [openScrollDefault, setOpenScrollDefault] = React.useState(false)
  const [openCloseOnScroll, setOpenCloseOnScroll] = React.useState(false)
  const [scrollLog, setScrollLog] = React.useState<string[]>([])
  const scrollAnchorRef = React.useRef<HTMLButtonElement | null>(null)

  // OV-POS-06: Published geometry variables
  const [openPos06, setOpenPos06] = React.useState(false)
  const anchorPos06Ref = React.useRef<HTMLButtonElement | null>(null)

  const [openPos07, setOpenPos07] = React.useState(false)
  const [pos07Log, setPos07Log] = React.useState<string[]>([])
  const anchorPos07Ref = React.useRef<HTMLButtonElement | null>(null)

  const [openPos08, setOpenPos08] = React.useState(false)
  const [pos08Log, setPos08Log] = React.useState<string[]>([])
  const anchorPos08Ref = React.useRef<HTMLButtonElement | null>(null)

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

      {/* 5. OV-POS-09 + OV-TRG-06: Virtual Anchor + Interactive Trigger */}
      <section data-testid="section-virtual-anchor" style={{ marginBottom: 48 }}>
        <h3>OV-POS-09 + OV-TRG-06: Virtual Anchor with Interactive Trigger</h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Overlay
            open={virtualOpen}
            onOpenChange={setVirtualOpen}
            anchor={virtualPoint}
            isolation={false}
          >
            <Overlay.Trigger data-testid="btn-virtual-trigger">
              Virtual Anchor Trigger
            </Overlay.Trigger>
            <Overlay.Content
              data-testid="content-virtual"
              style={{ width: 180, height: 80, background: '#fef08a', padding: 12 }}
            >
              <p>Virtual Content</p>
              <button
                type="button"
                data-testid="btn-close-virtual"
                onClick={() => setVirtualOpen(false)}
              >
                Close Virtual
              </button>
            </Overlay.Content>
          </Overlay>

          <button
            type="button"
            data-testid="btn-move-virtual-coords"
            data-reference-overlay-ignore=""
            onClick={() => setVirtualPoint({ x: 450, y: 500 })}
          >
            Move Virtual to (450, 500)
          </button>
          <button
            type="button"
            data-testid="btn-set-sized-virtual"
            data-reference-overlay-ignore=""
            onClick={() => setVirtualPoint({ x: 400, y: 200, width: 100, height: 50 })}
          >
            Set Sized Virtual (400, 200, 100x50)
          </button>
          <button
            type="button"
            data-testid="btn-reset-virtual-point"
            data-reference-overlay-ignore=""
            onClick={() => setVirtualPoint({ x: 300, y: 300 })}
          >
            Reset Virtual Point
          </button>
        </div>
      </section>

      {/* 6. OV-SCRL-01 + OV-SCRL-02: closeOnScroll behavior */}
      <section data-testid="section-close-on-scroll" style={{ marginBottom: 48 }}>
        <h3>OV-SCRL-01 + OV-SCRL-02: closeOnScroll Mechanics</h3>
        <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
          <button
            type="button"
            data-testid="btn-open-scroll-default"
            onClick={() => setOpenScrollDefault(true)}
          >
            Open closeOnScroll Omitted
          </button>
          <button
            type="button"
            data-testid="btn-open-close-on-scroll"
            onClick={() => setOpenCloseOnScroll(true)}
          >
            Open closeOnScroll=true
          </button>
        </div>

        <div style={{ display: 'flex', gap: 24 }}>
          {/* Ancestor scroll container */}
          <div
            data-testid="ancestor-scroll-container"
            style={{
              width: 320,
              height: 200,
              overflowY: 'auto',
              border: '2px solid #3b82f6',
              padding: 16,
            }}
          >
            <div style={{ height: 600, position: 'relative' }}>
              <p>Scrollable Ancestor Content</p>
              <button
                type="button"
                ref={scrollAnchorRef}
                data-testid="btn-scroll-anchor"
                style={{ marginTop: 60 }}
              >
                Scroll Anchor Target
              </button>

              {/* OV-SCRL-01: closeOnScroll omitted (false) */}
              <Overlay
                open={openScrollDefault}
                onOpenChange={setOpenScrollDefault}
                anchor={scrollAnchorRef}
                isolation={false}
                onDismiss={() => setScrollLog(l => [...l, 'dismiss:default'])}
              >
                <Overlay.Content
                  data-testid="content-scroll-default"
                  style={{ width: 180, height: 70, background: '#bbf7d0', padding: 8 }}
                >
                  <p>Pins to Anchor</p>
                  <button
                    type="button"
                    data-testid="btn-close-scroll-default"
                    onClick={() => setOpenScrollDefault(false)}
                  >
                    Close
                  </button>
                </Overlay.Content>
              </Overlay>

              {/* OV-SCRL-02: closeOnScroll={true} */}
              <Overlay
                open={openCloseOnScroll}
                onOpenChange={setOpenCloseOnScroll}
                anchor={scrollAnchorRef}
                closeOnScroll={true}
                isolation={false}
                onDismiss={() => setScrollLog(l => [...l, 'dismiss:closeOnScroll'])}
              >
                <Overlay.Content
                  data-testid="content-close-on-scroll"
                  style={{ width: 220, height: 160, background: '#fed7aa', padding: 8 }}
                >
                  <p>Close on Scroll Content</p>
                  <div
                    data-testid="content-inner-scroll"
                    style={{
                      maxHeight: 50,
                      overflowY: 'auto',
                      border: '1px solid #999',
                      padding: 4,
                    }}
                  >
                    <p>Inner scroll item 1</p>
                    <p>Inner scroll item 2</p>
                    <p>Inner scroll item 3</p>
                    <p>Inner scroll item 4</p>
                  </div>
                  <textarea
                    data-testid="content-inner-textarea"
                    defaultValue={'Line 1\nLine 2\nLine 3\nLine 4\nLine 5'}
                    rows={2}
                    style={{ width: '100%', marginTop: 4 }}
                  />
                  <button
                    type="button"
                    data-testid="btn-close-close-on-scroll"
                    onClick={() => setOpenCloseOnScroll(false)}
                  >
                    Close
                  </button>
                </Overlay.Content>
              </Overlay>
            </div>
          </div>

          {/* Unrelated sibling scroll container */}
          <div
            data-testid="unrelated-scroll-container"
            style={{
              width: 240,
              height: 200,
              overflowY: 'auto',
              border: '2px dashed #9ca3af',
              padding: 16,
            }}
          >
            <div style={{ height: 500 }}>
              <p>Unrelated Scrollable Container</p>
              <p>Scrolling here must never dismiss open overlays.</p>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <strong>Scroll events log:</strong>{' '}
          <span data-testid="scroll-events-log">{scrollLog.join(',')}</span>
          <button
            type="button"
            data-testid="btn-clear-scroll-log"
            style={{ marginLeft: 8 }}
            onClick={() => setScrollLog([])}
          >
            Clear Log
          </button>
        </div>
      </section>

      {/* 7. OV-POS-06: Published Available and Anchor Geometry Variables */}
      <section data-testid="section-pos-06" style={{ marginBottom: 48 }}>
        <h3>OV-POS-06: Available and Anchor Geometry Variables</h3>
        <button
          type="button"
          ref={anchorPos06Ref}
          data-testid="anchor-target-pos-06"
          style={{ width: 140, height: 45, marginLeft: 50, marginTop: 20 }}
          onClick={() => setOpenPos06(true)}
        >
          Anchor Size Target (140x45)
        </button>
        <Overlay
          open={openPos06}
          onOpenChange={setOpenPos06}
          anchor={anchorPos06Ref}
          isolation={false}
        >
          <Overlay.Content
            data-testid="content-pos-06"
            placement="bottom-start"
            style={{ width: 250, height: 300, background: '#fef9c3', padding: 12 }}
          >
            <p>Size Middleware Content</p>
            <button
              type="button"
              data-testid="btn-close-pos-06"
              onClick={() => setOpenPos06(false)}
            >
              Close
            </button>
          </Overlay.Content>
        </Overlay>
      </section>

      {/* OV-POS-07: Clip flags without closing */}
      <section data-testid="section-pos-07" style={{ marginBottom: 48 }}>
        <h3>OV-POS-07: Hide flags without dismiss</h3>
        <div
          data-testid="pos-07-clip"
          style={{
            height: 72,
            width: 260,
            overflow: 'auto',
            border: '1px solid #9ca3af',
            marginBottom: 12,
          }}
        >
          <div style={{ height: 240, paddingTop: 8 }}>
            <button
              type="button"
              ref={anchorPos07Ref}
              data-testid="anchor-target-pos-07"
              style={{ width: 140, height: 36 }}
              onClick={() => {
                setPos07Log(['open'])
                setOpenPos07(true)
              }}
            >
              Clip Anchor
            </button>
          </div>
        </div>
        <pre data-testid="pos-07-log">{pos07Log.join(',')}</pre>
        <Overlay
          open={openPos07}
          onOpenChange={setOpenPos07}
          anchor={anchorPos07Ref}
          isolation={false}
          onDismiss={() => {
            setPos07Log(l => [...l, 'dismiss'])
            setOpenPos07(false)
          }}
        >
          <Overlay.Content
            data-testid="content-pos-07"
            placement="bottom-start"
            shift={false}
            style={{ width: 180, height: 80, background: '#ffe4e6', padding: 8 }}
          >
            <p>Hide middleware content</p>
            <button type="button" data-testid="btn-close-pos-07" onClick={() => setOpenPos07(false)}>
              Close
            </button>
          </Overlay.Content>
        </Overlay>
      </section>

      {/* OV-POS-08: Living autoUpdate */}
      <section data-testid="section-pos-08" style={{ marginBottom: 48 }}>
        <h3>OV-POS-08: Living autoUpdate</h3>
        <div
          data-testid="pos-08-scroller"
          style={{
            height: 120,
            width: 320,
            overflow: 'auto',
            border: '1px solid #9ca3af',
            position: 'relative',
          }}
        >
          <div style={{ height: 360, padding: 16 }}>
            <button
              type="button"
              ref={anchorPos08Ref}
              data-testid="anchor-target-pos-08"
              style={{ width: 140, height: 36, marginTop: 80 }}
              onClick={() => {
                setPos08Log(['open'])
                setOpenPos08(true)
              }}
            >
              Live Anchor
            </button>
          </div>
        </div>
        <pre data-testid="pos-08-log">{pos08Log.join(',')}</pre>
        <Overlay
          open={openPos08}
          onOpenChange={setOpenPos08}
          anchor={anchorPos08Ref}
          isolation={false}
          onDismiss={() => {
            setPos08Log(l => [...l, 'dismiss'])
            setOpenPos08(false)
          }}
        >
          <Overlay.Content
            data-testid="content-pos-08"
            placement="bottom-start"
            style={{ width: 160, height: 60, background: '#dbeafe', padding: 8 }}
          >
            <p>Living position</p>
            <button type="button" data-testid="btn-close-pos-08" onClick={() => setOpenPos08(false)}>
              Close
            </button>
          </Overlay.Content>
        </Overlay>
      </section>
    </div>
  )
}
