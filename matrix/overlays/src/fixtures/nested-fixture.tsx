import * as React from 'react'
import { Overlay } from '@reference-ui/lib'
import { OutOfOrderExitFixture } from './out-of-order-exit-fixture'
import { InterruptedTeardownFixture } from './interrupted-teardown-fixture'
import { StrictModeFixture } from './strict-mode-fixture'

export function NestedFixture() {
  const [parentOpen, setParentOpen] = React.useState(false)
  const [childOpen, setChildOpen] = React.useState(false)
  const [grandchildOpen, setGrandchildOpen] = React.useState(false)
  const [eventsLog, setEventsLog] = React.useState<string[]>([])

  const log = (msg: string) => setEventsLog(prev => [...prev, msg])

  return (
    <div data-testid="nested-fixture-root">
      <h2>Nested Overlay & Cascade Fixtures</h2>
      <button
        type="button"
        data-testid="btn-open-root-parent"
        onClick={() => {
          log('open:parent')
          setParentOpen(true)
        }}
      >
        Open Parent Dialog
      </button>
      <button
        type="button"
        data-testid="btn-close-root-parent"
        data-reference-overlay-ignore=""
        style={{ marginLeft: 8 }}
        onClick={() => {
          log('close:parent')
          setParentOpen(false)
        }}
      >
        Close Parent
      </button>
      <button
        type="button"
        data-testid="btn-clear-nested-log"
        data-reference-overlay-ignore=""
        style={{ marginLeft: 8 }}
        onClick={() => setEventsLog([])}
      >
        Clear Log
      </button>

      <pre data-testid="nested-events-log">{eventsLog.join(',')}</pre>

      <Overlay
        open={parentOpen}
        onOpenChange={setParentOpen}
        onEscape={() => log('parent:escape')}
        onOutsidePress={() => log('parent:outside')}
        onDismiss={() => {
          log('parent:dismiss')
          setParentOpen(false)
        }}
      >
        <Overlay.Backdrop
          data-testid="nested-parent-backdrop"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', zIndex: 1000 }}
        />
        <Overlay.Content
          data-testid="nested-parent-content"
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#fff',
            padding: 24,
            minWidth: 320,
            borderRadius: 8,
            zIndex: 1001,
          }}
        >
          <h3>Parent Dialog (Level 1)</h3>
          <button type="button" data-testid="btn-parent-action">
            Parent Action Button
          </button>
          <button
            type="button"
            data-testid="btn-parent-close-inner"
            style={{ marginLeft: 8 }}
            onClick={() => {
              log('close:parent')
              setParentOpen(false)
            }}
          >
            Close Parent
          </button>

          <div style={{ marginTop: 16 }}>
            <Overlay
              open={childOpen}
              onOpenChange={setChildOpen}
              isolation={false}
              onEscape={() => log('child:escape')}
              onOutsidePress={() => log('child:outside')}
              onDismiss={() => {
                log('child:dismiss')
                setChildOpen(false)
              }}
            >
              <Overlay.Trigger
                data-testid="btn-open-child"
                onClick={() => log('open:child')}
              >
                Open Child Popover
              </Overlay.Trigger>
              <Overlay.Content
                data-testid="nested-child-content"
                role="dialog"
                placement="bottom-start"
                offset={8}
                style={{
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #ccc',
                  padding: 16,
                  borderRadius: 6,
                  minWidth: 220,
                  zIndex: 1002,
                }}
              >
                <h4>Child Popover (Level 2)</h4>
                <button type="button" data-testid="btn-child-action">
                  Child Action Button
                </button>

                <div style={{ marginTop: 12 }}>
                  <Overlay
                    open={grandchildOpen}
                    onOpenChange={setGrandchildOpen}
                    isolation={false}
                    onEscape={() => log('grandchild:escape')}
                    onOutsidePress={() => log('grandchild:outside')}
                    onDismiss={() => {
                      log('grandchild:dismiss')
                      setGrandchildOpen(false)
                    }}
                  >
                    <Overlay.Trigger
                      data-testid="btn-open-grandchild"
                      onClick={() => log('open:grandchild')}
                    >
                      Open Grandchild
                    </Overlay.Trigger>
                    <Overlay.Content
                      data-testid="nested-grandchild-content"
                      role="dialog"
                      placement="right-start"
                      offset={6}
                      style={{
                        backgroundColor: '#fff',
                        border: '2px solid #333',
                        padding: 12,
                        minWidth: 160,
                        zIndex: 1003,
                      }}
                    >
                      <h5>Grandchild (Level 3)</h5>
                      <button type="button" data-testid="btn-grandchild-action">
                        Grandchild Button
                      </button>
                    </Overlay.Content>
                  </Overlay>
                </div>
              </Overlay.Content>
            </Overlay>
          </div>
        </Overlay.Content>
      </Overlay>

      {/* Outside Button to test clicking outside all layers */}
      <div style={{ marginTop: 40 }}>
        <button
          type="button"
          data-testid="btn-nested-outside-target"
          style={{ position: 'relative', zIndex: 2000 }}
          onClick={() => log('click:outside-target')}
        >
          Outside Target
        </button>
      </div>

      <SiblingLayersFixture />
      <OutOfOrderExitFixture />
      <InterruptedTeardownFixture />
      <StrictModeFixture />
    </div>
  )
}

export function SiblingLayersFixture() {
  const [open1, setOpen1] = React.useState(false)
  const [open2, setOpen2] = React.useState(false)
  const [open3, setOpen3] = React.useState(false)

  return (
    <div data-testid="sibling-fixture-root" style={{ marginTop: 40 }}>
      <h3>Sibling Layers (OV-LAYER-08)</h3>
      <button data-testid="btn-sib-all" onClick={() => { setOpen1(true); setOpen2(true); setOpen3(true); }}>Open All</button>

      <button data-testid="btn-sib-close-2" data-reference-overlay-ignore onClick={() => setOpen2(false)}>Close 2</button>

      {open1 && (
        <Overlay open={open1} onOpenChange={setOpen1} onDismiss={() => setOpen1(false)} isolation={false}>
          <Overlay.Content data-testid="sib-content-1" style={{ position: 'fixed', top: 50, left: 50, padding: 20, background: 'red', zIndex: 2001 }}>Layer 1</Overlay.Content>
        </Overlay>
      )}
      {open2 && (
        <Overlay open={open2} onOpenChange={setOpen2} onDismiss={() => setOpen2(false)} isolation={false}>
          <Overlay.Content data-testid="sib-content-2" style={{ position: 'fixed', top: 100, left: 100, padding: 20, background: 'green', zIndex: 2002 }}>Layer 2</Overlay.Content>
        </Overlay>
      )}
      {open3 && (
        <Overlay open={open3} onOpenChange={setOpen3} onDismiss={() => setOpen3(false)} isolation={false}>
          <Overlay.Content data-testid="sib-content-3" style={{ position: 'fixed', top: 150, left: 150, padding: 20, background: 'blue', zIndex: 2003 }}>Layer 3</Overlay.Content>
        </Overlay>
      )}
    </div>
  )
}
