import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { ReferenceLibrary } from '../ReferenceLibrary'
import { Overlay } from '../Overlay'
import { toast } from '../Toast'
import { announce } from './index'
import { AnnouncerHost, getAnnouncerSnapshot } from './internal'

/**
 * Manual + AT verification fixture for the invisible announcer runtime
 * (FEATURES.md #1). The live regions themselves are visually hidden; the
 * readout below mirrors their textContent via MutationObserver, so every
 * click proves an AT-observable insertion happened.
 */
export function AnnouncerFixture() {
  const [politeMirror, setPoliteMirror] = React.useState('')
  const [assertiveMirror, setAssertiveMirror] = React.useState('')
  const [mutations, setMutations] = React.useState(0)
  const politeCount = React.useRef(0)
  const assertiveCount = React.useRef(0)

  React.useEffect(() => {
    let observer: MutationObserver | null = null
    let cancelled = false

    const sync = (polite: Element | null, assertive: Element | null) => {
      setPoliteMirror(polite?.textContent ?? '')
      setAssertiveMirror(assertive?.textContent ?? '')
    }

    const attach = () => {
      if (cancelled) return
      const polite = document.querySelector('[data-reference-announcer="polite"]')
      const assertive = document.querySelector('[data-reference-announcer="assertive"]')
      if (!polite || !assertive) {
        requestAnimationFrame(attach)
        return
      }
      sync(polite, assertive)
      observer = new MutationObserver(records => {
        setMutations(count => count + records.length)
        sync(polite, assertive)
      })
      observer.observe(polite, { childList: true, characterData: true, subtree: true })
      observer.observe(assertive, { childList: true, characterData: true, subtree: true })
    }
    attach()

    return () => {
      cancelled = true
      observer?.disconnect()
    }
  }, [])

  return (
    <ReferenceLibrary>
      <div
        data-testid="announcer-fixture-root"
        style={{
          padding: '24px',
          fontFamily: 'sans-serif',
          maxWidth: '560px',
        }}
      >
        <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Announcer</h2>
        <p style={{ margin: '0 0 16px 0', fontSize: '13px' }}>
          The polite/assertive live regions are visually hidden. Click to
          announce, then confirm the readout mirror and (with a screen reader)
          the spoken message.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          <button
            type="button"
            data-testid="btn-announce-polite"
            onClick={() => {
              politeCount.current += 1
              announce(`Polite message #${politeCount.current}`, { politeness: 'polite' })
            }}
            style={{ padding: '6px 12px', cursor: 'pointer' }}
          >
            Announce Polite
          </button>
          <button
            type="button"
            data-testid="btn-announce-assertive"
            onClick={() => {
              assertiveCount.current += 1
              announce(`Assertive message #${assertiveCount.current}`, { politeness: 'assertive' })
            }}
            style={{ padding: '6px 12px', cursor: 'pointer' }}
          >
            Announce Assertive
          </button>
        </div>

        <dl style={{ margin: 0, fontSize: '13px', display: 'grid', gap: '4px' }}>
          <div>
            <dt style={{ display: 'inline', fontWeight: 600 }}>Polite region: </dt>
            <dd data-testid="readout-polite" style={{ display: 'inline', margin: 0 }}>
              {politeMirror === '' ? '(empty)' : politeMirror}
            </dd>
          </div>
          <div>
            <dt style={{ display: 'inline', fontWeight: 600 }}>Assertive region: </dt>
            <dd data-testid="readout-assertive" style={{ display: 'inline', margin: 0 }}>
              {assertiveMirror === '' ? '(empty)' : assertiveMirror}
            </dd>
          </div>
          <div>
            <dt style={{ display: 'inline', fontWeight: 600 }}>Observed mutations: </dt>
            <dd data-testid="readout-mutations" style={{ display: 'inline', margin: 0 }}>
              {mutations}
            </dd>
          </div>
        </dl>
      </div>
    </ReferenceLibrary>
  )
}

declare global {
  interface Window {
    __annLog?: string[]
    __annSnap?: unknown
    __ovLog?: string[]
  }
}

/**
 * Page-level AT-observable mutation log. Records region additions
 * (`added-polite:<text-at-add>`) separately from insertions into an
 * already-mounted region (`polite:<text>`), so remount tests can tell a
 * mutation apart from initial-text paint (ANN-LIFE-02/04).
 */
function useAnnouncerLog() {
  React.useEffect(() => {
    window.__annLog = []
    const log = window.__annLog
    const recordAdded = (el: Element) => {
      const kind = el.getAttribute('data-reference-announcer')
      if (kind === 'polite' || kind === 'assertive') {
        log.push(`added-${kind}:${el.textContent ?? ''}`)
      }
    }
    const observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'childList') {
          record.addedNodes.forEach(node => {
            if (node instanceof Element) {
              recordAdded(node)
              node.querySelectorAll('[data-reference-announcer]').forEach(recordAdded)
            }
          })
        }
        const target =
          record.target instanceof Element ? record.target : record.target.parentElement
        const region = target?.closest?.('[data-reference-announcer]')
        if (region) {
          const kind = region.getAttribute('data-reference-announcer')
          log.push(`${kind}:${region.textContent ?? ''}`)
        }
      }
    })
    observer.observe(document.body, { childList: true, characterData: true, subtree: true })
    return () => observer.disconnect()
  }, [])
}

function nextFrameBoundary() {
  return new Promise<void>(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
}

const panelStyle: React.CSSProperties = {
  padding: '24px',
  fontFamily: 'sans-serif',
  maxWidth: '640px',
}

const buttonRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  marginBottom: '16px',
}

/** API / DOM / live-machine probe: one elected host plus announce triggers. */
export function AnnouncerProbe() {
  useAnnouncerLog()
  const [snapText, setSnapText] = React.useState('')
  return (
    <ReferenceLibrary>
      <div data-testid="announcer-probe-root" style={panelStyle}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Announcer probe</h2>
        <div style={buttonRowStyle}>
          <button type="button" data-testid="btn-ann-polite" onClick={() => announce('Saved')}>
            Polite (defaults)
          </button>
          <button
            type="button"
            data-testid="btn-ann-assertive"
            onClick={() => announce('Session expired', { politeness: 'assertive' })}
          >
            Assertive
          </button>
          <button
            type="button"
            data-testid="btn-ann-both"
            onClick={() => {
              announce('Background sync complete', { politeness: 'polite' })
              announce('Session expired', { politeness: 'assertive' })
            }}
          >
            Both channels
          </button>
          <button
            type="button"
            data-testid="btn-ann-blanks"
            onClick={() => {
              announce('')
              announce('   ')
              announce('\n\t')
            }}
          >
            Blanks
          </button>
          <button type="button" data-testid="btn-ann-complete" onClick={() => announce('Complete')}>
            Complete
          </button>
          <button
            type="button"
            data-testid="btn-ann-markup"
            onClick={() => announce('<b>Saved</b>')}
          >
            Markup
          </button>
          <button
            type="button"
            data-testid="btn-ann-burst"
            onClick={() => {
              announce('First')
              announce('Second')
            }}
          >
            Burst
          </button>
          <button
            type="button"
            data-testid="btn-ann-repeat"
            onClick={async () => {
              announce('Saved')
              await nextFrameBoundary()
              announce('Saved')
            }}
          >
            Repeat Saved
          </button>
          <button type="button" data-testid="btn-ann-stagger-a" onClick={() => announce('A')}>
            Stagger A
          </button>
          <button
            type="button"
            data-testid="btn-ann-stagger-b"
            onClick={() => announce('B', { politeness: 'assertive' })}
          >
            Stagger B
          </button>
          <button
            type="button"
            data-testid="btn-ann-snapshot"
            onClick={() => {
              const snap = getAnnouncerSnapshot(document)
              window.__annSnap = snap
              setSnapText(JSON.stringify(snap))
            }}
          >
            Snapshot
          </button>
          <button type="button" data-testid="btn-tab-a">
            Tab A
          </button>
          <button type="button" data-testid="btn-tab-b">
            Tab B
          </button>
        </div>
        <p data-testid="readout-snap" style={{ fontSize: '12px' }}>
          {snapText === '' ? '(no snapshot)' : snapText}
        </p>
      </div>
    </ReferenceLibrary>
  )
}

/** Activation / pending / remount: the library itself is toggled hostless. */
export function AnnouncerLifecycle() {
  const [mounted, setMounted] = React.useState(false)
  useAnnouncerLog()
  return (
    <div data-testid="announcer-lifecycle-root" style={panelStyle}>
      <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Announcer lifecycle</h2>
      <div style={buttonRowStyle}>
        <button
          type="button"
          data-testid="btn-life-queue"
          onClick={() => {
            announce('Saved')
            announce('Ready')
          }}
        >
          Queue Saved+Ready
        </button>
        <button
          type="button"
          data-testid="btn-life-queue50"
          onClick={() => {
            for (let i = 0; i < 50; i += 1) {
              announce(`msg-${String(i).padStart(2, '0')}`)
            }
          }}
        >
          Queue 50
        </button>
        <button type="button" data-testid="btn-life-mount" onClick={() => setMounted(true)}>
          Mount library
        </button>
        <button type="button" data-testid="btn-life-unmount" onClick={() => setMounted(false)}>
          Unmount library
        </button>
        <button type="button" data-testid="btn-life-before" onClick={() => announce('Before')}>
          Announce Before
        </button>
        <button type="button" data-testid="btn-life-after" onClick={() => announce('After')}>
          Announce After
        </button>
        <button
          type="button"
          data-testid="btn-life-restored"
          onClick={() => announce('Connection restored', { document })}
        >
          Announce Restored
        </button>
        <button type="button" data-testid="btn-life-old" onClick={() => announce('Old')}>
          Announce Old
        </button>
      </div>
      <p data-testid="readout-life-mounted">{mounted ? 'mounted' : 'hostless'}</p>
      {mounted ? (
        <ReferenceLibrary>
          <span data-testid="life-app">app</span>
        </ReferenceLibrary>
      ) : null}
    </div>
  )
}

/** ANN-LIFE-03: pending replay under an explicit StrictMode library. */
export function AnnouncerStrictLifecycle() {
  const [mounted, setMounted] = React.useState(false)
  useAnnouncerLog()
  return (
    <div data-testid="announcer-strict-root" style={panelStyle}>
      <button type="button" data-testid="btn-strict-queue" onClick={() => announce('Ready')}>
        Queue Ready
      </button>
      <button type="button" data-testid="btn-strict-mount" onClick={() => setMounted(true)}>
        Mount strict library
      </button>
      {mounted ? (
        <React.StrictMode>
          <ReferenceLibrary>
            <span data-testid="strict-app">app</span>
          </ReferenceLibrary>
        </React.StrictMode>
      ) : null}
    </div>
  )
}

const overlayDialogStyle: React.CSSProperties = {
  position: 'fixed',
  top: '20%',
  left: '20%',
  background: '#fff',
  color: '#111',
  padding: 24,
  border: '1px solid #ccc',
  minWidth: 280,
  zIndex: 20,
}

/** Overlay exemption + toast-adjacency probe. */
export function AnnouncerOverlayFixture() {
  const [open, setOpen] = React.useState(false)
  useAnnouncerLog()
  React.useEffect(() => {
    window.__ovLog = []
  }, [])
  return (
    <ReferenceLibrary>
      <div data-testid="announcer-overlay-root" style={panelStyle}>
        <div data-testid="ov-sibling">ordinary sibling</div>
        <div style={buttonRowStyle}>
          <button
            type="button"
            data-testid="btn-ov-announce-polite"
            onClick={() => announce('Saved')}
          >
            Announce Saved
          </button>
          <button
            type="button"
            data-testid="btn-ov-announce-assertive"
            onClick={() => announce('Urgent', { politeness: 'assertive' })}
          >
            Announce Urgent
          </button>
          <button
            type="button"
            data-testid="btn-ov-toast-silent"
            onClick={() => toast('Payment failed', { id: 'silent', duration: false })}
          >
            Silent toast
          </button>
          <button
            type="button"
            data-testid="btn-ov-toast-announced"
            onClick={() =>
              toast('Draft visual', { id: 'announced', duration: false, announce: 'Draft was saved' })
            }
          >
            Announced toast
          </button>
        </div>
        <Overlay
          open={open}
          onOpenChange={setOpen}
          onOutsidePress={() => window.__ovLog?.push('outside')}
          onDismiss={() => window.__ovLog?.push('dismiss')}
        >
          <Overlay.Trigger data-testid="btn-ov-open">Open overlay</Overlay.Trigger>
          <Overlay.Content data-testid="ov-modal" role="dialog" style={overlayDialogStyle}>
            <p>Modal</p>
            <div style={buttonRowStyle}>
              <button
                type="button"
                data-testid="btn-ovm-announce-polite"
                onClick={() => announce('Saved')}
              >
                Modal announce Saved
              </button>
              <button
                type="button"
                data-testid="btn-ovm-announce-assertive"
                onClick={() => announce('Urgent', { politeness: 'assertive' })}
              >
                Modal announce Urgent
              </button>
              <button
                type="button"
                data-testid="btn-ovm-toast-silent"
                onClick={() => toast('Payment failed', { id: 'silent', duration: false })}
              >
                Modal silent toast
              </button>
            </div>
            <button type="button" data-testid="btn-ov-close" onClick={() => setOpen(false)}>
              Close overlay
            </button>
          </Overlay.Content>
        </Overlay>
        <p data-testid="readout-ov-log">{(window.__ovLog ?? []).join(',')}</p>
      </div>
    </ReferenceLibrary>
  )
}

/** Host election: primary + standby libraries plus an accidental direct host. */
export function AnnouncerElection() {
  const [primary, setPrimary] = React.useState(true)
  const [rogue, setRogue] = React.useState(false)
  useAnnouncerLog()
  return (
    <div data-testid="announcer-election-root" style={panelStyle}>
      <div style={buttonRowStyle}>
        <button type="button" data-testid="btn-el-announce" onClick={() => announce('Once')}>
          Announce Once
        </button>
        <button type="button" data-testid="btn-el-handoff" onClick={() => announce('Handoff')}>
          Announce Handoff
        </button>
        <button
          type="button"
          data-testid="btn-el-two"
          onClick={() => announce('Two')}
        >
          Announce Two
        </button>
        <button
          type="button"
          data-testid="btn-el-unmount-primary"
          onClick={() => setPrimary(false)}
        >
          Unmount primary
        </button>
        <button type="button" data-testid="btn-el-rogue" onClick={() => setRogue(true)}>
          Mount rogue host
        </button>
      </div>
      {primary ? (
        <div data-testid="root-primary">
          <ReferenceLibrary>
            <div>primary app</div>
          </ReferenceLibrary>
        </div>
      ) : null}
      <div data-testid="root-standby">
        <ReferenceLibrary>
          <div>standby app</div>
        </ReferenceLibrary>
      </div>
      {rogue ? <AnnouncerHost /> : null}
    </div>
  )
}

/** Multi-document: elected top host plus a test-only host in an iframe. */
export function AnnouncerMultiDoc() {
  const frameRef = React.useRef<HTMLIFrameElement>(null)
  const [frameReady, setFrameReady] = React.useState(false)
  useAnnouncerLog()

  React.useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    let root: ReturnType<typeof createRoot> | null = null
    let mountEl: HTMLDivElement | null = null
    let cancelled = false
    const attach = () => {
      if (cancelled) return
      const doc = frame.contentDocument
      if (!doc || !doc.body) {
        requestAnimationFrame(attach)
        return
      }
      mountEl = doc.createElement('div')
      mountEl.setAttribute('data-testid', 'md-frame-root')
      doc.body.appendChild(mountEl)
      root = createRoot(mountEl)
      root.render(<AnnouncerHost document={doc} />)
      setFrameReady(true)
    }
    attach()
    return () => {
      cancelled = true
      root?.unmount()
      mountEl?.remove()
    }
  }, [])

  return (
    <ReferenceLibrary>
      <div data-testid="announcer-multidoc-root" style={panelStyle}>
        <div style={buttonRowStyle}>
          <button
            type="button"
            data-testid="btn-md-top"
            onClick={() => announce('Top', { document })}
          >
            Announce Top
          </button>
          <button
            type="button"
            data-testid="btn-md-frame"
            onClick={() => {
              const doc = frameRef.current?.contentDocument
              if (doc) announce('Frame', { document: doc })
            }}
          >
            Announce Frame
          </button>
          <button type="button" data-testid="btn-md-untargeted" onClick={() => announce('Nope')}>
            Announce untargeted
          </button>
        </div>
        <p data-testid="md-ready">{frameReady ? 'ready' : 'pending'}</p>
        <iframe ref={frameRef} data-testid="md-frame" title="second document" />
      </div>
    </ReferenceLibrary>
  )
}
