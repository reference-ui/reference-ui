import * as React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { FocusLock } from '@reference-ui/lib'

class LockErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: (message: string) => void },
  { message: string | null }
> {
  state: { message: string | null } = { message: null }

  static getDerivedStateFromError(error: Error) {
    return { message: error.message }
  }

  componentDidCatch(error: Error) {
    this.props.onError(error.message)
  }

  render() {
    if (this.state.message) {
      return <pre data-testid="fl-dom-03-error">{this.state.message}</pre>
    }
    return this.props.children
  }
}

function MiniLock({
  id,
  label,
}: {
  id: string
  label: string
}) {
  const [on, setOn] = React.useState(false)
  return (
    <div data-testid={`${id}-root`}>
      <button type="button" data-testid={`${id}-trigger`} onClick={() => setOn(true)}>
        {label}
      </button>
      <button type="button" data-testid={`${id}-outside`}>
        {label} outside
      </button>
      {on && (
        <FocusLock>
          <div data-testid={`${id}-container`} style={{ border: '1px solid #333', padding: 8 }}>
            <button type="button" data-testid={`${id}-first`}>
              {label} first
            </button>
            <button type="button" data-testid={`${id}-last`}>
              {label} last
            </button>
            <button type="button" data-testid={`${id}-close`} onClick={() => setOn(false)}>
              Close {label}
            </button>
          </div>
        </FocusLock>
      )}
    </div>
  )
}

export function FocusLockFixture() {
  const [active, setActive] = React.useState(false)
  const [nested, setNested] = React.useState(false)
  const [catalog, setCatalog] = React.useState(false)
  const [shadow, setShadow] = React.useState(false)
  const [proximity, setProximity] = React.useState(false)
  const [openerRemoved, setOpenerRemoved] = React.useState(false)
  const [emptyOn, setEmptyOn] = React.useState(false)
  const [initOn, setInitOn] = React.useState(false)
  const [initMode, setInitMode] = React.useState<'second' | 'negative' | 'invalid' | 'skip' | 'inside' | 'disabled'>('second')
  const [trapOn, setTrapOn] = React.useState(false)
  const [trapMode, setTrapMode] = React.useState<'pointer' | 'null' | 'remove' | 'disable' | 'cancel' | 'blur'>('pointer')
  const [shardLab, setShardLab] = React.useState(false)
  const [shardAttached, setShardAttached] = React.useState(false)
  const [overlapOn, setOverlapOn] = React.useState(false)
  const [stackOn, setStackOn] = React.useState(false)
  const [stackB, setStackB] = React.useState(false)
  const [stackC, setStackC] = React.useState(false)
  const [restoreLab, setRestoreLab] = React.useState(false)
  const [restoreOff, setRestoreOff] = React.useState(false)
  const [restoreMode, setRestoreMode] = React.useState<'skip' | 'invalid' | 'replace' | 'stale'>('stale')
  const [tabLab, setTabLab] = React.useState(false)
  const [tabExtra, setTabExtra] = React.useState(false)
  const [tabOrder, setTabOrder] = React.useState(['A', 'B', 'C'])
  const [blockTab, setBlockTab] = React.useState(false)
  const [liveLab, setLiveLab] = React.useState(false)
  const [liveDisabled, setLiveDisabled] = React.useState(false)
  const [liveInert, setLiveInert] = React.useState(false)
  const [docsOn, setDocsOn] = React.useState(false)
  const [invalidKind, setInvalidKind] = React.useState<null | 'text' | 'fragment' | 'many'>(null)
  const [invalidError, setInvalidError] = React.useState('')
  const [dom04On, setDom04On] = React.useState(false)
  const [dom04Count, setDom04Count] = React.useState(0)
  const [eventLog, setEventLog] = React.useState('')
  const [shadowExotica, setShadowExotica] = React.useState(false)
  const [compOn, setCompOn] = React.useState(false)

  const shardRef = React.useRef<HTMLDivElement | null>(null)
  const delayedShardRef = React.useRef<HTMLDivElement | null>(null)
  const shadowHostRef = React.useRef<HTMLDivElement | null>(null)
  const closedHostRef = React.useRef<HTMLDivElement | null>(null)
  const slotHostRef = React.useRef<HTMLDivElement | null>(null)
  const nestedShadowRef = React.useRef<HTMLDivElement | null>(null)
  const portalShardRef = React.useRef<HTMLDivElement | null>(null)
  const overlapShardRef = React.useRef<HTMLDivElement | null>(null)
  const initSecondRef = React.useRef<HTMLButtonElement | null>(null)
  const initNegRef = React.useRef<HTMLButtonElement | null>(null)
  const restoreBRef = React.useRef<HTMLButtonElement | null>(null)
  const restoreCRef = React.useRef<HTMLButtonElement | null>(null)
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null)
  const rootARef = React.useRef<HTMLDivElement | null>(null)
  const rootBRef = React.useRef<HTMLDivElement | null>(null)
  const iframeRootRef = React.useRef<Root | null>(null)
  const [initDisabled, setInitDisabled] = React.useState(false)
  const [trapDisabled, setTrapDisabled] = React.useState(false)
  const [restoreTarget, setRestoreTarget] = React.useState<'B' | 'C'>('B')

  React.useEffect(() => {
    if (!shadow || !shadowHostRef.current) return
    const host = shadowHostRef.current
    if (host.shadowRoot) return
    const root = host.attachShadow({ mode: 'open' })
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.dataset.testid = 'shadow-inner-button'
    btn.textContent = 'Shadow inner'
    root.append(btn)
  }, [shadow])

  React.useEffect(() => {
    if (!shadowExotica) return
    if (closedHostRef.current && !closedHostRef.current.shadowRoot) {
      const root = closedHostRef.current.attachShadow({ mode: 'closed' })
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.textContent = 'closed-inner'
      btn.dataset.testid = 'closed-inner'
      root.append(btn)
      ;(window as unknown as { __flClosedInner: HTMLButtonElement }).__flClosedInner = btn
    }
    if (slotHostRef.current && !slotHostRef.current.shadowRoot) {
      const host = slotHostRef.current
      host.tabIndex = 0
      const root = host.attachShadow({ mode: 'open' })
      const inner = document.createElement('button')
      inner.type = 'button'
      inner.dataset.testid = 'slot-inner'
      inner.textContent = 'slot-inner'
      const slot = document.createElement('slot')
      root.append(inner, slot)
    }
    if (nestedShadowRef.current && !nestedShadowRef.current.shadowRoot) {
      const outer = nestedShadowRef.current.attachShadow({ mode: 'open' })
      const innerHost = document.createElement('div')
      innerHost.dataset.testid = 'nested-shadow-inner-host'
      const innerRoot = innerHost.attachShadow({ mode: 'open' })
      const deep = document.createElement('button')
      deep.type = 'button'
      deep.dataset.testid = 'nested-shadow-deep'
      deep.textContent = 'Deep'
      innerRoot.append(deep)
      outer.append(innerHost)
    }
  }, [shadowExotica])

  React.useEffect(() => {
    if (!docsOn) return
    const roots: Root[] = []
    if (rootARef.current) {
      const a = createRoot(rootARef.current)
      a.render(<MiniLock id="fl-root-a" label="A" />)
      roots.push(a)
    }
    if (rootBRef.current) {
      const b = createRoot(rootBRef.current)
      b.render(<MiniLock id="fl-root-b" label="B" />)
      roots.push(b)
    }
    const frame = iframeRef.current
    if (frame) {
      const doc = frame.contentDocument
      if (doc) {
        doc.body.replaceChildren()
        const mount = doc.createElement('div')
        doc.body.append(mount)
        const r = createRoot(mount)
        r.render(<MiniLock id="fl-frame" label="Frame" />)
        iframeRootRef.current = r
      }
    }
    return () => {
      roots.forEach(root => root.unmount())
      iframeRootRef.current?.unmount()
      iframeRootRef.current = null
    }
  }, [docsOn])

  const catalogLock = catalog && (
    <FocusLock>
      <form data-testid="catalog-lock" style={{ border: '2px solid purple', padding: 16 }}>
        <button type="button" data-testid="catalog-btn">
          Catalog button
        </button>
        <input data-testid="catalog-input" />
        <select data-testid="catalog-select">
          <option>One</option>
        </select>
        <textarea data-testid="catalog-textarea" />
        <a href="#catalog" data-testid="catalog-link">
          Link
        </a>
        <a data-testid="catalog-nohref">No href</a>
        <audio data-testid="catalog-audio" />
        <div contentEditable={false} data-testid="catalog-ce-false">
          frozen
        </div>
        <button type="button" tabIndex={-1} data-testid="catalog-negative">
          Negative
        </button>
        <div style={{ display: 'none' }}>
          <button type="button" data-testid="catalog-display-none">
            Display none
          </button>
        </div>
        <div style={{ visibility: 'hidden' }}>
          <button type="button" data-testid="catalog-vis-hidden">
            Vis hidden
          </button>
        </div>
        <div hidden>
          <button type="button" data-testid="catalog-attr-hidden">
            Hidden
          </button>
        </div>
        <div inert>
          <button type="button" data-testid="catalog-inert">
            Inert
          </button>
        </div>
        <span
          tabIndex={0}
          data-testid="catalog-zero"
          style={{ display: 'block', width: 0, height: 0, overflow: 'hidden', padding: 0, border: 0, position: 'absolute' }}
        />
        <button type="button" data-testid="catalog-fixed" style={{ position: 'fixed', right: 8, bottom: 8 }}>
          Fixed
        </button>
        <button type="button" data-testid="catalog-opacity" style={{ opacity: 0 }}>
          Opacity
        </button>
        <button type="button" data-testid="catalog-aria-hidden" aria-hidden="true">
          Aria hidden
        </button>
        <fieldset disabled>
          <legend>
            <button type="button" data-testid="catalog-legend-btn">
              Legend
            </button>
          </legend>
          <button type="button" data-testid="catalog-fieldset-body">
            Fieldset body
          </button>
        </fieldset>
        <div>
          <input type="radio" name="catalog-g" data-testid="catalog-radio-a" />
          <input type="radio" name="catalog-g" data-testid="catalog-radio-b" defaultChecked />
        </div>
        <details data-testid="catalog-details">
          <summary data-testid="catalog-summary">Summary</summary>
          <button type="button" data-testid="catalog-details-inner">
            Details inner
          </button>
        </details>
        <button type="button" disabled data-testid="catalog-disabled">
          Disabled
        </button>
        <iframe data-testid="catalog-iframe" title="catalog-iframe" style={{ width: 40, height: 24 }} />
        <button type="button" data-testid="btn-close-catalog" onClick={() => setCatalog(false)}>
          Close catalog
        </button>
      </form>
    </FocusLock>
  )

  return (
    <div data-testid="focus-lock-fixture-root">
      <h1>FocusLock Fixture</h1>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button type="button" data-testid="btn-trigger" onClick={() => setActive(true)}>
          Open Lock
        </button>
        <button type="button" data-testid="outside-button">
          Outside Button
        </button>
        <button type="button" data-testid="btn-open-nested" onClick={() => setActive(true)}>
          Open nested host
        </button>
        <button type="button" data-testid="btn-open-catalog" onClick={() => setCatalog(true)}>
          Open catalog
        </button>
        <button type="button" data-testid="btn-open-shadow" onClick={() => setShadow(true)}>
          Open shadow
        </button>
        {!openerRemoved && (
          <button type="button" data-testid="btn-proximity-opener" onClick={() => setProximity(true)}>
            Open proximity
          </button>
        )}
        <button type="button" data-testid="btn-proximity-right">
          Proximity right
        </button>
        <button type="button" data-testid="btn-open-empty" onClick={() => setEmptyOn(true)}>
          Open empty
        </button>
        <button type="button" data-testid="btn-open-init" onClick={() => setInitOn(true)}>
          Open init
        </button>
        <button type="button" data-testid="btn-open-trap" onClick={() => setTrapOn(true)}>
          Open trap
        </button>
        <button type="button" data-testid="btn-open-shard-lab" onClick={() => setShardLab(true)}>
          Open shard lab
        </button>
        <button type="button" data-testid="btn-open-overlap" onClick={() => setOverlapOn(true)}>
          Open overlap
        </button>
        <button type="button" data-testid="btn-open-stack" onClick={() => setStackOn(true)}>
          Open stack
        </button>
        <button type="button" data-testid="btn-open-restore-lab" onClick={() => {
          setRestoreOff(false)
          setRestoreLab(true)
        }}>
          Open restore lab
        </button>
        <button type="button" data-testid="btn-open-tab-lab" onClick={() => setTabLab(true)}>
          Open tab lab
        </button>
        <button type="button" data-testid="btn-open-live" onClick={() => setLiveLab(true)}>
          Open live catalog
        </button>
        <button type="button" data-testid="btn-open-docs" onClick={() => setDocsOn(true)}>
          Open documents
        </button>
        <button type="button" data-testid="btn-open-shadow-exotica" onClick={() => setShadowExotica(true)}>
          Open shadow exotica
        </button>
        <button type="button" data-testid="btn-open-comp" onClick={() => setCompOn(true)}>
          Open composition
        </button>
        <button type="button" data-testid="btn-open-dom-04" onClick={() => setDom04On(true)}>
          Open stable ref
        </button>
        <button type="button" data-testid="btn-invalid-text" onClick={() => setInvalidKind('text')}>
          Invalid text
        </button>
        <button type="button" data-testid="btn-invalid-fragment" onClick={() => setInvalidKind('fragment')}>
          Invalid fragment
        </button>
        <button type="button" data-testid="btn-invalid-many" onClick={() => setInvalidKind('many')}>
          Invalid many
        </button>
        <button type="button" data-testid="btn-init-mode-second" onClick={() => setInitMode('second')}>
          Init second
        </button>
        <button type="button" data-testid="btn-init-mode-negative" onClick={() => setInitMode('negative')}>
          Init negative
        </button>
        <button type="button" data-testid="btn-init-mode-invalid" onClick={() => setInitMode('invalid')}>
          Init invalid
        </button>
        <button type="button" data-testid="btn-init-mode-skip" onClick={() => setInitMode('skip')}>
          Init skip
        </button>
        <button type="button" data-testid="btn-init-mode-inside" onClick={() => setInitMode('inside')}>
          Init inside
        </button>
        <button type="button" data-testid="btn-init-mode-disabled" onClick={() => setInitMode('disabled')}>
          Init disabled
        </button>
        <button type="button" data-testid="fl-restore-b" ref={restoreBRef}>
          Restore B
        </button>
        <button type="button" data-testid="fl-restore-c" ref={restoreCRef}>
          Restore C
        </button>
        <button type="button" data-testid="fl-newer-focus">
          Newer focus
        </button>
        <pre data-testid="fl-event-log">{eventLog}</pre>
        <pre data-testid="fl-dom-03-log">{invalidError}</pre>
      </div>

      {active && (
        <FocusLock shards={[shardRef]}>
          <div
            data-testid="focus-lock-container"
            style={{
              border: '2px solid blue',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <h2>Active Lock</h2>
            <button type="button" data-testid="lock-btn-first">
              First Button
            </button>
            <input type="text" data-testid="lock-input-middle" placeholder="Middle Input" />
            <button type="button" data-testid="lock-btn-last">
              Last Button
            </button>
            <button type="button" data-testid="btn-open-inner-lock" onClick={() => setNested(true)}>
              Open inner lock
            </button>
            <button type="button" data-testid="btn-close-lock" onClick={() => setActive(false)}>
              Close Lock
            </button>

            {nested && (
              <FocusLock>
                <div data-testid="inner-lock-container" style={{ border: '1px solid red', padding: 8 }}>
                  <button type="button" data-testid="inner-lock-first">
                    Inner first
                  </button>
                  <button type="button" data-testid="inner-lock-last">
                    Inner last
                  </button>
                  <button
                    type="button"
                    data-testid="btn-close-inner-lock"
                    onClick={() => setNested(false)}
                  >
                    Close inner
                  </button>
                </div>
              </FocusLock>
            )}
          </div>
        </FocusLock>
      )}

      {catalogLock}

      {shadow && (
        <FocusLock>
          <div data-testid="shadow-lock" style={{ border: '2px solid teal', padding: 16 }}>
            <button type="button" data-testid="shadow-before">
              Before
            </button>
            <div ref={shadowHostRef} data-testid="shadow-host" />
            <button type="button" data-testid="shadow-after">
              After
            </button>
            <button type="button" data-testid="btn-close-shadow" onClick={() => setShadow(false)}>
              Close shadow
            </button>
          </div>
        </FocusLock>
      )}

      {proximity && (
        <FocusLock>
          <div data-testid="proximity-lock" style={{ border: '2px solid orange', padding: 16 }}>
            <button
              type="button"
              data-testid="btn-remove-opener-close"
              onClick={() => {
                setOpenerRemoved(true)
                setProximity(false)
              }}
            >
              Remove opener and close
            </button>
          </div>
        </FocusLock>
      )}

      <div
        ref={shardRef}
        data-testid="shard-container"
        style={{ border: '2px dashed green', padding: '16px', marginTop: '16px' }}
      >
        <h3>Registered Shard</h3>
        <button type="button" data-testid="shard-button">
          Shard Button
        </button>
      </div>

      {emptyOn && (
        <FocusLock>
          <section data-testid="empty-lock">Empty</section>
        </FocusLock>
      )}
      <button type="button" data-testid="btn-close-empty" onClick={() => setEmptyOn(false)}>
        Close empty
      </button>
      <button type="button" data-testid="after-empty">
        After empty
      </button>

      {initOn && (
        <FocusLock
          disabled={initMode === 'disabled' || initDisabled}
          initialFocus={
            initMode === 'skip'
              ? false
              : initMode === 'second'
                ? initSecondRef
                : initMode === 'negative'
                  ? initNegRef
                  : initMode === 'invalid'
                    ? () => document.querySelector<HTMLElement>('[data-testid="outside-button"]')
                    : true
          }
        >
          <div data-testid="init-lock" style={{ border: '1px solid #06c', padding: 8 }}>
            <button type="button" data-testid="init-first">
              Init first
            </button>
            <button type="button" data-testid="init-second" ref={initSecondRef}>
              Init second
            </button>
            <button type="button" tabIndex={-1} data-testid="init-negative" ref={initNegRef}>
              Init negative
            </button>
            <button type="button" data-testid="btn-enable-init" onClick={() => setInitDisabled(false)}>
              Enable init
            </button>
            <button
              type="button"
              data-testid="init-close"
              onClick={() => {
                setInitOn(false)
                setInitDisabled(false)
              }}
            >
              Close init
            </button>
          </div>
        </FocusLock>
      )}
      <button
        type="button"
        data-testid="btn-focus-init-second-then-enable"
        onClick={() => {
          setInitMode('inside')
          setInitDisabled(true)
          setInitOn(true)
        }}
      >
        Focus second then enable
      </button>
      <button type="button" data-testid="btn-disable-init" onClick={() => setInitDisabled(true)}>
        Disable init
      </button>

      {trapOn && (
        <FocusLock disabled={trapDisabled} restoreFocus={trapMode === 'cancel' ? false : true}>
          <div data-testid="trap-lock" style={{ border: '1px solid #900', padding: 8 }}>
            <button type="button" data-testid="trap-a">
              Trap A
            </button>
            <button type="button" data-testid="trap-b">
              Trap B
            </button>
            <button
              type="button"
              data-testid="trap-c"
              onClick={() => {
                if (trapMode === 'remove') {
                  const node = document.querySelector('[data-testid="trap-c"]')
                  node?.parentElement?.removeChild(node)
                }
              }}
            >
              Trap C
            </button>
            <button type="button" data-testid="btn-disable-trap-node" onClick={() => {
              const node = document.querySelector<HTMLButtonElement>('[data-testid="trap-b"]')
              if (node) node.disabled = true
            }}>
              Disable B
            </button>
            <button type="button" data-testid="btn-trap-disable-lock" onClick={() => setTrapDisabled(true)}>
              Disable lock
            </button>
            <button type="button" data-testid="btn-close-trap" onClick={() => {
              setTrapOn(false)
              setTrapDisabled(false)
            }}>
              Close trap
            </button>
          </div>
        </FocusLock>
      )}
      <button
        type="button"
        data-testid="trap-outside"
        onPointerDown={() => setEventLog(log => `${log}|pointerdown`)}
        onClick={() => setEventLog(log => `${log}|click`)}
      >
        Trap outside
      </button>
      <button
        type="button"
        data-testid="btn-trap-mode-pointer"
        onClick={() => setTrapMode('pointer')}
      >
        Trap pointer
      </button>
      <button type="button" data-testid="btn-trap-mode-remove" onClick={() => setTrapMode('remove')}>
        Trap remove
      </button>
      <button type="button" data-testid="btn-trap-mode-disable" onClick={() => setTrapMode('disable')}>
        Trap disable
      </button>
      <button type="button" data-testid="btn-trap-mode-cancel" onClick={() => setTrapMode('cancel')}>
        Trap cancel
      </button>
      <button
        type="button"
        data-testid="btn-prevent-tab"
        onClick={() => {
          const b = document.querySelector<HTMLButtonElement>('[data-testid="trap-b"]')
          b?.addEventListener(
            'keydown',
            event => {
              if (event.key === 'Tab') event.preventDefault()
            },
            { once: false }
          )
        }}
      >
        Arm prevent Tab
      </button>

      {shardLab && (
        <FocusLock shards={shardAttached ? [delayedShardRef] : [delayedShardRef]}>
          <div data-testid="shard-lab" style={{ border: '1px dashed #080', padding: 8 }}>
            <button type="button" data-testid="shard-lab-main">
              Shard lab main
            </button>
            <button type="button" data-testid="btn-attach-shard" onClick={() => setShardAttached(true)}>
              Attach shard
            </button>
            <button
              type="button"
              data-testid="btn-remove-focused-shard"
              onClick={() => setShardAttached(false)}
            >
              Remove shard
            </button>
            <button type="button" data-testid="btn-close-shard-lab" onClick={() => {
              setShardLab(false)
              setShardAttached(false)
            }}>
              Close shard lab
            </button>
          </div>
        </FocusLock>
      )}
      {shardAttached && (
        <div ref={delayedShardRef} data-testid="delayed-shard" style={{ border: '1px dashed #0a0', padding: 8 }}>
          <button type="button" data-testid="delayed-shard-btn">
            Delayed shard
          </button>
        </div>
      )}

      {overlapOn && (
        <FocusLock shards={[overlapShardRef, overlapShardRef]}>
          <div data-testid="overlap-lock" style={{ border: '1px solid #555', padding: 8 }}>
            <button type="button" data-testid="overlap-main">
              Overlap main
            </button>
            <button type="button" data-testid="btn-close-overlap" onClick={() => setOverlapOn(false)}>
              Close overlap
            </button>
          </div>
        </FocusLock>
      )}
      {overlapOn && (
        <div ref={overlapShardRef} data-testid="overlap-parent-shard">
          <button type="button" data-testid="overlap-parent-btn">
            Parent shard
          </button>
          <div data-testid="overlap-child-shard">
            <button type="button" data-testid="overlap-child-btn">
              Child shard
            </button>
          </div>
        </div>
      )}
      {overlapOn && (
        <button type="button" data-testid="overlap-unregistered">
          Unregistered
        </button>
      )}

      {stackOn && (
        <FocusLock>
          <div data-testid="stack-a" style={{ border: '1px solid #222', padding: 8 }}>
            <button type="button" data-testid="stack-a-btn">
              A
            </button>
            <button type="button" data-testid="btn-open-stack-b" onClick={() => setStackB(true)}>
              Open B
            </button>
            {stackB && (
              <FocusLock>
                <div data-testid="stack-b" style={{ border: '1px solid #444', padding: 8 }}>
                  <button type="button" data-testid="stack-b-btn">
                    B
                  </button>
                  <button type="button" data-testid="btn-open-stack-c" onClick={() => setStackC(true)}>
                    Open C
                  </button>
                  <button type="button" data-testid="btn-close-stack-b" onClick={() => setStackB(false)}>
                    Close B
                  </button>
                </div>
              </FocusLock>
            )}
            {stackC && (
              <FocusLock>
                <div data-testid="stack-c" style={{ border: '1px solid #666', padding: 8 }}>
                  <button type="button" data-testid="stack-c-btn">
                    C
                  </button>
                  <button type="button" data-testid="btn-close-stack-c" onClick={() => setStackC(false)}>
                    Close C
                  </button>
                </div>
              </FocusLock>
            )}
            <button type="button" data-testid="btn-close-stack-a" onClick={() => setStackOn(false)}>
              Close A
            </button>
          </div>
        </FocusLock>
      )}

      {restoreLab && (
        <FocusLock
          disabled={restoreOff}
          restoreFocus={
            restoreMode === 'skip'
              ? false
              : restoreMode === 'invalid'
                ? () => document.querySelector<HTMLElement>('[data-testid="fl-restore-gone"]')
                : restoreMode === 'replace'
                  ? restoreTarget === 'B'
                    ? restoreBRef
                    : restoreCRef
                  : true
          }
        >
          <div data-testid="restore-lab" style={{ border: '1px solid #b80', padding: 8 }}>
            <button type="button" data-testid="restore-lab-btn">
              Restore lab
            </button>
            <button
              type="button"
              data-testid="btn-close-restore-lab"
              onClick={() => {
                if (restoreMode === 'replace') {
                  setRestoreTarget('C')
                  setRestoreOff(true)
                  return
                }
                setRestoreLab(false)
                setRestoreOff(false)
              }}
            >
              Close restore lab
            </button>
          </div>
        </FocusLock>
      )}
      <button type="button" data-testid="btn-restore-mode-skip" onClick={() => setRestoreMode('skip')}>
        Restore skip
      </button>
      <button
        type="button"
        data-testid="btn-restore-mode-invalid"
        onClick={() => setRestoreMode('invalid')}
      >
        Restore invalid
      </button>
      <button
        type="button"
        data-testid="btn-restore-mode-replace"
        onClick={() => {
          setRestoreTarget('B')
          setRestoreOff(false)
          setRestoreMode('replace')
        }}
      >
        Restore replace
      </button>
      <button
        type="button"
        data-testid="btn-restore-mode-stale"
        onClick={() => setRestoreMode('stale')}
      >
        Restore stale
      </button>

      {tabLab && (
        <FocusLock>
          <div data-testid="tab-lab" style={{ border: '1px solid #08c', padding: 8 }}>
            {tabOrder.map(label => (
              <button
                key={label}
                type="button"
                data-testid={`tab-${label.toLowerCase()}`}
                tabIndex={label === 'A' ? 3 : label === 'B' ? 1 : 2}
                onKeyDown={event => {
                  if (blockTab && event.key === 'Tab') event.preventDefault()
                }}
              >
                {label}
              </button>
            ))}
            {tabExtra && (
              <button type="button" data-testid="tab-d">
                D
              </button>
            )}
          </div>
        </FocusLock>
      )}
      {tabLab && (
        <div>
          <button type="button" data-testid="btn-insert-d" onClick={() => setTabExtra(true)}>
            Insert D
          </button>
          <button
            type="button"
            data-testid="btn-reorder-tab"
            onClick={() => setTabOrder(['C', 'A', 'B'])}
          >
            Reorder
          </button>
          <button
            type="button"
            data-testid="btn-remove-tab-b"
            onClick={() => setTabOrder(order => order.filter(item => item !== 'B'))}
          >
            Remove B
          </button>
          <button type="button" data-testid="btn-arm-block-tab" onClick={() => setBlockTab(true)}>
            Block Tab
          </button>
          <button
            type="button"
            data-testid="btn-close-tab-lab"
            onClick={() => {
              setTabLab(false)
              setTabExtra(false)
              setBlockTab(false)
              setTabOrder(['A', 'B', 'C'])
            }}
          >
            Close tab lab
          </button>
        </div>
      )}

      {liveLab && (
        <FocusLock>
          <div data-testid="live-lock" style={{ border: '1px solid #606', padding: 8 }}>
            <button type="button" data-testid="live-a">
              Live A
            </button>
            <button type="button" data-testid="live-b" disabled={liveDisabled}>
              Live B
            </button>
            <button type="button" data-testid="live-c" {...(liveInert ? { inert: true } : {})}>
              Live C
            </button>
          </div>
        </FocusLock>
      )}
      {liveLab && (
        <div>
          <button type="button" data-testid="btn-live-disable-b" onClick={() => setLiveDisabled(true)}>
            Disable B
          </button>
          <button type="button" data-testid="btn-live-inert-c" onClick={() => setLiveInert(true)}>
            Inert C
          </button>
          <button type="button" data-testid="btn-close-live" onClick={() => setLiveLab(false)}>
            Close live
          </button>
        </div>
      )}

      {shadowExotica && (
        <FocusLock shards={[portalShardRef]}>
          <div data-testid="shadow-exotica" style={{ border: '1px solid teal', padding: 8 }}>
            <button type="button" data-testid="exotica-before">
              Before
            </button>
            <div ref={slotHostRef} data-testid="slot-host">
              <button type="button" data-testid="slot-assigned">
                Assigned
              </button>
            </div>
            <div ref={closedHostRef} data-testid="closed-host" tabIndex={0} />
            <div ref={nestedShadowRef} data-testid="nested-shadow-host" />
            <button type="button" data-testid="exotica-after">
              After
            </button>
            <button type="button" data-testid="btn-close-shadow-exotica" onClick={() => setShadowExotica(false)}>
              Close shadow exotica
            </button>
          </div>
        </FocusLock>
      )}
      <div
        ref={portalShardRef}
        data-testid="portal-shadow-shard"
        style={{ border: '1px dashed teal', padding: 8 }}
      >
        <button type="button" data-testid="portal-shadow-shard-btn">
          Portalled shard
        </button>
      </div>

      {compOn && (
        <FocusLock>
          <form data-testid="comp-lock" style={{ border: '2px solid black', padding: 8 }}>
            <input data-testid="comp-input" />
            <a href="#comp" data-testid="comp-link">
              Comp link
            </a>
            <input type="radio" name="comp-g" data-testid="comp-radio-a" defaultChecked />
            <input type="radio" name="comp-g" data-testid="comp-radio-b" />
            <button type="button" disabled data-testid="comp-disabled">
              Disabled
            </button>
            <div hidden>
              <button type="button" data-testid="comp-hidden">
                Hidden
              </button>
            </div>
            <button type="button" data-testid="comp-close" onClick={() => setCompOn(false)}>
              Close comp
            </button>
          </form>
        </FocusLock>
      )}

      {docsOn && (
        <section data-testid="docs-lab">
          <div ref={rootARef} data-testid="two-root-host-a" />
          <div ref={rootBRef} data-testid="two-root-host-b" />
          <iframe
            ref={iframeRef}
            data-testid="fl-iframe"
            title="focus-lock-frame"
            style={{ width: 320, height: 160, border: '1px solid #ccc' }}
          />
        </section>
      )}

      {dom04On && (
        <FocusLock>
          <div
            data-testid="fl-dom-04-container"
            data-attach-count={dom04Count}
            ref={node => {
              if (node) {
                setDom04Count(count => (count < 8 ? count + 1 : count))
              }
            }}
          >
            <button type="button" data-testid="fl-dom-04-btn">
              Stable
            </button>
          </div>
        </FocusLock>
      )}

      {invalidKind && (
        <LockErrorBoundary onError={setInvalidError}>
          {invalidKind === 'text' ? (
            <FocusLock>{'nope' as unknown as React.ReactElement}</FocusLock>
          ) : invalidKind === 'fragment' ? (
            <FocusLock>
              <>
                <button type="button">A</button>
                <button type="button">B</button>
              </>
            </FocusLock>
          ) : (
            <FocusLock>
              {
                [
                  <button key="a" type="button">
                    A
                  </button>,
                  <button key="b" type="button">
                    B
                  </button>,
                ] as unknown as React.ReactElement
              }
            </FocusLock>
          )}
        </LockErrorBoundary>
      )}
    </div>
  )
}

