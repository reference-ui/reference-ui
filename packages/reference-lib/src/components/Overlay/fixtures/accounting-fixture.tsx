import * as React from 'react'
import { Overlay } from '../index'
import { useOverlayStore } from '../stack'

/**
 * Live layer-stack readout for the composition accounting audit
 * (FEATURES #2, OV-LAYER-11): entry count, open count, root count, and
 * whether every branched entry resolves its parentId inside the store.
 */
function LayerAuditReadout() {
  const layers = useOverlayStore(s => s.layers)
  const count = layers.length
  const open = layers.filter(l => l.open).length
  const roots = layers.filter(
    l => l.parentId === null || !layers.some(p => p.id === l.parentId)
  ).length
  const linked = layers.every(
    l => l.parentId === null || layers.some(p => p.id === l.parentId)
  )
  return (
    <pre data-testid="acct-layers">{`count:${count},open:${open},roots:${roots},linked:${linked}`}</pre>
  )
}

const kind = (event: Event) => event.constructor.name

/**
 * Popover-in-dialog branch shape: the dialog is one coordinator/Content
 * pair, the nested popover a second pair logging its own layer entry
 * branched under the dialog. Granular handlers also record the real DOM
 * event constructor (FEATURES #3, OV-ESC-08 / OV-OUT-12).
 */
export function AccountingFixture() {
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [popOpen, setPopOpen] = React.useState(false)
  const [log, setLog] = React.useState<string[]>([])
  const push = (msg: string) => setLog(prev => [...prev, msg])

  return (
    <div data-testid="accounting-fixture-root">
      <h2>Layer accounting audit</h2>
      <button type="button" data-testid="btn-open-acct-dialog" onClick={() => setDialogOpen(true)}>
        Open dialog
      </button>
      <button
        type="button"
        data-testid="btn-clear-acct-log"
        data-reference-overlay-ignore=""
        style={{ marginLeft: 8 }}
        onClick={() => setLog([])}
      >
        Clear log
      </button>
      <pre data-testid="acct-log">{log.join(',')}</pre>
      <LayerAuditReadout />

      <Overlay
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onDismiss={() => setDialogOpen(false)}
      >
        <Overlay.Backdrop
          data-testid="acct-dialog-backdrop"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', zIndex: 1000 }}
        />
        <Overlay.Content
          data-testid="acct-dialog-content"
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
          <h3>Accounting dialog</h3>
          <Overlay
            open={popOpen}
            onOpenChange={setPopOpen}
            isolation={false}
            onEscape={e => push(`escape:${kind(e)}`)}
            onOutsidePress={e => push(`outside:${kind(e)}`)}
            onInteractOutside={e => push(`interact:${kind(e)}`)}
            onDismiss={() => {
              push('dismiss')
              setPopOpen(false)
            }}
          >
            <Overlay.Trigger data-testid="btn-open-acct-pop">
              Open popover
            </Overlay.Trigger>
            <Overlay.Content
              data-testid="acct-pop-content"
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
              <button type="button" data-testid="btn-acct-pop-action">
                Pop action
              </button>
            </Overlay.Content>
          </Overlay>
        </Overlay.Content>
      </Overlay>
    </div>
  )
}
