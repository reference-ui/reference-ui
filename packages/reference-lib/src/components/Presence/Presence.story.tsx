import * as React from 'react'
import { Presence } from './Presence'

export function PresenceFixture() {
  const [instantPresent, setInstantPresent] = React.useState(true)
  const [transitionPresent, setTransitionPresent] = React.useState(true)
  const [animationPresent, setAnimationPresent] = React.useState(true)
  const [nestedParentPresent, setNestedParentPresent] = React.useState(true)
  const [nestedChildPresent, setNestedChildPresent] = React.useState(true)

  return (
    <div
      data-testid="presence-fixture-root"
      style={{
        padding: '24px',
        fontFamily: 'sans-serif',
        maxWidth: '700px',
      }}
    >
      <style>{`
        .transition-box {
          transition: opacity 300ms ease, transform 300ms ease;
          opacity: 1;
          transform: translateY(0);
          padding: 12px;
          background: #e0f2fe;
          border: 1px solid #38bdf8;
          border-radius: 6px;
        }
        .transition-box[data-state="closed"] {
          opacity: 0;
          transform: translateY(-20px);
        }

        @keyframes fadeOutAnimation {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0; transform: scale(0.9); }
        }

        .animation-box {
          padding: 12px;
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 6px;
        }
        .animation-box[data-state="open"] {
          opacity: 1;
        }
        .animation-box[data-state="closed"] {
          animation: fadeOutAnimation 300ms forwards;
        }

        .nested-parent {
          padding: 16px;
          background: #f3e8ff;
          border: 1px solid #a855f7;
          border-radius: 6px;
          transition: opacity 150ms ease;
          opacity: 1;
        }
        .nested-parent[data-state="closed"] {
          opacity: 0;
        }

        .nested-child {
          margin-top: 8px;
          padding: 10px;
          background: #ede9fe;
          border: 1px dashed #8b5cf6;
          border-radius: 4px;
          transition: transform 350ms ease;
          transform: scale(1);
        }
        .nested-child[data-state="closed"] {
          transform: scale(0.8);
        }
      `}</style>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        <button
          type="button"
          data-testid="btn-toggle-instant"
          onClick={() => setInstantPresent(p => !p)}
          style={{ padding: '6px 12px', cursor: 'pointer' }}
        >
          Toggle Instant
        </button>
        <button
          type="button"
          data-testid="btn-toggle-transition"
          onClick={() => setTransitionPresent(p => !p)}
          style={{ padding: '6px 12px', cursor: 'pointer' }}
        >
          Toggle Transition
        </button>
        <button
          type="button"
          data-testid="btn-toggle-animation"
          onClick={() => setAnimationPresent(p => !p)}
          style={{ padding: '6px 12px', cursor: 'pointer' }}
        >
          Toggle Animation
        </button>
        <button
          type="button"
          data-testid="btn-toggle-nested-parent"
          onClick={() => setNestedParentPresent(p => !p)}
          style={{ padding: '6px 12px', cursor: 'pointer' }}
        >
          Toggle Nested Parent
        </button>
        <button
          type="button"
          data-testid="btn-toggle-nested-child"
          onClick={() => setNestedChildPresent(p => !p)}
          style={{ padding: '6px 12px', cursor: 'pointer' }}
        >
          Toggle Nested Child
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* 1. Instant Exit */}
        <section>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Instant Exit</h3>
          <Presence present={instantPresent}>
            <div
              data-testid="instant-box"
              style={{
                padding: '12px',
                background: '#dcfce7',
                border: '1px solid #22c55e',
                borderRadius: '6px',
              }}
            >
              Instant Content
            </div>
          </Presence>
        </section>

        {/* 2. Transition Exit */}
        <section>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Transition Exit</h3>
          <Presence present={transitionPresent}>
            <div
              data-testid="transition-box"
              className="transition-box"
              data-state={transitionPresent ? 'open' : 'closed'}
            >
              Transition Content
            </div>
          </Presence>
        </section>

        {/* 3. Animation Exit */}
        <section>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Animation Exit</h3>
          <Presence present={animationPresent}>
            <div
              data-testid="animation-box"
              className="animation-box"
              data-state={animationPresent ? 'open' : 'closed'}
            >
              Animation Content
            </div>
          </Presence>
        </section>

        {/* 4. Nested Presence */}
        <section>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Nested Presence</h3>
          <Presence present={nestedParentPresent}>
            <div
              data-testid="nested-parent"
              className="nested-parent"
              data-state={nestedParentPresent ? 'open' : 'closed'}
            >
              Parent Content
              <Presence present={nestedChildPresent}>
                <div
                  data-testid="nested-child"
                  className="nested-child"
                  data-state={nestedChildPresent ? 'open' : 'closed'}
                >
                  Child Content
                </div>
              </Presence>
            </div>
          </Presence>
        </section>
      </div>
    </div>
  )
}

export function PresenceNestedBornClosedFixture() {
  const [parentPresent, setParentPresent] = React.useState(true)
  const [childPresent, setChildPresent] = React.useState(false)

  return (
    <div
      data-testid="bornclosed-fixture-root"
      style={{
        padding: '24px',
        fontFamily: 'sans-serif',
        maxWidth: '700px',
      }}
    >
      <style>{`
        .bornclosed-parent {
          padding: 16px;
          background: #f3e8ff;
          border: 1px solid #a855f7;
          border-radius: 6px;
          transition: opacity 150ms ease;
          opacity: 1;
        }
        .bornclosed-parent[data-state="closed"] {
          opacity: 0;
        }

        .bornclosed-child {
          margin-top: 8px;
          padding: 10px;
          background: #ede9fe;
          border: 1px dashed #8b5cf6;
          border-radius: 4px;
          transition: transform 350ms ease;
          transform: scale(1);
        }
        .bornclosed-child[data-state="closed"] {
          transform: scale(0.8);
        }
      `}</style>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        <button
          type="button"
          data-testid="btn-toggle-bornclosed-parent"
          onClick={() => setParentPresent(p => !p)}
          style={{ padding: '6px 12px', cursor: 'pointer' }}
        >
          Toggle Born-Closed Parent
        </button>
        <button
          type="button"
          data-testid="btn-toggle-bornclosed-child"
          onClick={() => setChildPresent(p => !p)}
          style={{ padding: '6px 12px', cursor: 'pointer' }}
        >
          Toggle Born-Closed Child
        </button>
      </div>

      <Presence present={parentPresent}>
        <div
          data-testid="bornclosed-parent"
          className="bornclosed-parent"
          data-state={parentPresent ? 'open' : 'closed'}
        >
          Parent Content
          <Presence present={childPresent}>
            <div
              data-testid="bornclosed-child"
              className="bornclosed-child"
              data-state={childPresent ? 'open' : 'closed'}
            >
              Child Content
            </div>
          </Presence>
        </div>
      </Presence>
    </div>
  )
}

export function PresenceExitCompleteFixture() {
  const [transitionPresent, setTransitionPresent] = React.useState(true)
  const [instantPresent, setInstantPresent] = React.useState(true)
  const [interruptPresent, setInterruptPresent] = React.useState(true)
  const [wedgeParentPresent, setWedgeParentPresent] = React.useState(true)
  const [coordParentPresent, setCoordParentPresent] = React.useState(true)
  const [coordChildPresent, setCoordChildPresent] = React.useState(true)

  const [transitionCount, setTransitionCount] = React.useState(0)
  const [instantCount, setInstantCount] = React.useState(0)
  const [interruptCount, setInterruptCount] = React.useState(0)
  const [wedgeParentCount, setWedgeParentCount] = React.useState(0)
  const [wedgeChildCount, setWedgeChildCount] = React.useState(0)
  const [coordParentCount, setCoordParentCount] = React.useState(0)
  const [coordChildCount, setCoordChildCount] = React.useState(0)

  return (
    <div
      data-testid="exitcomplete-fixture-root"
      style={{
        padding: '24px',
        fontFamily: 'sans-serif',
        maxWidth: '700px',
      }}
    >
      <style>{`
        .exit-transition-box {
          transition: opacity 300ms ease, transform 300ms ease;
          opacity: 1;
          transform: translateY(0);
          padding: 12px;
          background: #e0f2fe;
          border: 1px solid #38bdf8;
          border-radius: 6px;
        }
        .exit-transition-box[data-state="closed"] {
          opacity: 0;
          transform: translateY(-20px);
        }

        .exit-nested-parent {
          padding: 16px;
          background: #f3e8ff;
          border: 1px solid #a855f7;
          border-radius: 6px;
          transition: opacity 150ms ease;
          opacity: 1;
        }
        .exit-nested-parent[data-state="closed"] {
          opacity: 0;
        }

        .exit-nested-child {
          margin-top: 8px;
          padding: 10px;
          background: #ede9fe;
          border: 1px dashed #8b5cf6;
          border-radius: 4px;
          transition: transform 350ms ease;
          transform: scale(1);
        }
        .exit-nested-child[data-state="closed"] {
          transform: scale(0.8);
        }
      `}</style>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        <button
          type="button"
          data-testid="btn-toggle-exit-transition"
          onClick={() => setTransitionPresent(p => !p)}
          style={{ padding: '6px 12px', cursor: 'pointer' }}
        >
          Toggle Exit Transition
        </button>
        <button
          type="button"
          data-testid="btn-toggle-exit-instant"
          onClick={() => setInstantPresent(p => !p)}
          style={{ padding: '6px 12px', cursor: 'pointer' }}
        >
          Toggle Exit Instant
        </button>
        <button
          type="button"
          data-testid="btn-toggle-exit-interrupt"
          onClick={() => setInterruptPresent(p => !p)}
          style={{ padding: '6px 12px', cursor: 'pointer' }}
        >
          Toggle Exit Interrupt
        </button>
        <button
          type="button"
          data-testid="btn-toggle-exit-wedge-parent"
          onClick={() => setWedgeParentPresent(p => !p)}
          style={{ padding: '6px 12px', cursor: 'pointer' }}
        >
          Toggle Exit Wedge Parent
        </button>
        <button
          type="button"
          data-testid="btn-toggle-exit-coord-parent"
          onClick={() => setCoordParentPresent(p => !p)}
          style={{ padding: '6px 12px', cursor: 'pointer' }}
        >
          Toggle Exit Coord Parent
        </button>
        <button
          type="button"
          data-testid="btn-toggle-exit-coord-child"
          onClick={() => setCoordChildPresent(p => !p)}
          style={{ padding: '6px 12px', cursor: 'pointer' }}
        >
          Toggle Exit Coord Child
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <section>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
            Transition Exit (<span data-testid="exitcount-transition">{transitionCount}</span>)
          </h3>
          <Presence
            present={transitionPresent}
            onExitComplete={() => setTransitionCount(c => c + 1)}
          >
            <div
              data-testid="exit-transition-box"
              className="exit-transition-box"
              data-state={transitionPresent ? 'open' : 'closed'}
            >
              Transition Content
            </div>
          </Presence>
        </section>

        <section>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
            Instant Exit (<span data-testid="exitcount-instant">{instantCount}</span>)
          </h3>
          <Presence present={instantPresent} onExitComplete={() => setInstantCount(c => c + 1)}>
            <div
              data-testid="exit-instant-box"
              style={{
                padding: '12px',
                background: '#dcfce7',
                border: '1px solid #22c55e',
                borderRadius: '6px',
              }}
            >
              Instant Content
            </div>
          </Presence>
        </section>

        <section>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
            Interrupt Exit (<span data-testid="exitcount-interrupt">{interruptCount}</span>)
          </h3>
          <Presence
            present={interruptPresent}
            onExitComplete={() => setInterruptCount(c => c + 1)}
          >
            <div
              data-testid="exit-interrupt-box"
              className="exit-transition-box"
              data-state={interruptPresent ? 'open' : 'closed'}
            >
              Interrupt Content
            </div>
          </Presence>
        </section>

        <section>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
            Wedge Parent (<span data-testid="exitcount-wedge-parent">{wedgeParentCount}</span>)
            / Child (<span data-testid="exitcount-wedge-child">{wedgeChildCount}</span>)
          </h3>
          <Presence
            present={wedgeParentPresent}
            onExitComplete={() => setWedgeParentCount(c => c + 1)}
          >
            <div
              data-testid="exit-wedge-parent"
              className="exit-nested-parent"
              data-state={wedgeParentPresent ? 'open' : 'closed'}
            >
              Wedge Parent Content
              <Presence present={false} onExitComplete={() => setWedgeChildCount(c => c + 1)}>
                <div
                  data-testid="exit-wedge-child"
                  className="exit-nested-child"
                  data-state="closed"
                >
                  Wedge Child Content
                </div>
              </Presence>
            </div>
          </Presence>
        </section>

        <section>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
            Coord Parent (<span data-testid="exitcount-coord-parent">{coordParentCount}</span>)
            / Child (<span data-testid="exitcount-coord-child">{coordChildCount}</span>)
          </h3>
          <Presence
            present={coordParentPresent}
            onExitComplete={() => setCoordParentCount(c => c + 1)}
          >
            <div
              data-testid="exit-coord-parent"
              className="exit-nested-parent"
              data-state={coordParentPresent ? 'open' : 'closed'}
            >
              Coord Parent Content
              <Presence
                present={coordChildPresent}
                onExitComplete={() => setCoordChildCount(c => c + 1)}
              >
                <div
                  data-testid="exit-coord-child"
                  className="exit-nested-child"
                  data-state={coordChildPresent ? 'open' : 'closed'}
                >
                  Coord Child Content
                </div>
              </Presence>
            </div>
          </Presence>
        </section>
      </div>
    </div>
  )
}

function ToggleButton({
  testId,
  present,
  onToggle,
  children,
}: {
  testId: string
  present: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      aria-expanded={present}
      onClick={onToggle}
      style={{ padding: '6px 12px', cursor: 'pointer' }}
    >
      {children}
    </button>
  )
}

const fixtureShell: React.CSSProperties = {
  padding: '24px',
  fontFamily: 'sans-serif',
  maxWidth: '700px',
}

const buttonRow: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  marginBottom: '16px',
}

const boxBase: React.CSSProperties = {
  padding: '12px',
  background: '#e0f2fe',
  border: '1px solid #38bdf8',
  borderRadius: '6px',
}

export function PresenceDomFixture() {
  const [clicks, setClicks] = React.useState(0)
  const [key, setKey] = React.useState<'A' | 'B'>('A')
  const dom02Log = React.useRef<string[]>([])
  // Render-time init: ref attaches fire before effects, so an effect reset
  // would wipe the mount entries. Stable per-key callbacks label detaches.
  const dom05InitRef = React.useRef(false)
  if (!dom05InitRef.current) {
    dom05InitRef.current = true
    ;(window as any).__dom05log = []
  }
  const refA = React.useCallback((node: HTMLDivElement | null) => {
    ;((window as any).__dom05log as string[]).push(`refA:${node ? 'attach' : 'detach'}`)
  }, [])
  const refB = React.useCallback((node: HTMLDivElement | null) => {
    ;((window as any).__dom05log as string[]).push(`refB:${node ? 'attach' : 'detach'}`)
  }, [])
  React.useEffect(() => {
    ;(window as any).__dom02log = dom02Log.current
  }, [])

  const emptyVariants: Array<{ label: string; child: any; present: boolean }> = [
    { label: 'null-open', child: null, present: true },
    { label: 'false-open', child: false, present: true },
    { label: 'emptyfrag-open', child: <React.Fragment />, present: true },
    { label: 'null-closed', child: null, present: false },
    { label: 'false-closed', child: false, present: false },
    { label: 'emptyfrag-closed', child: <React.Fragment />, present: false },
  ]

  return (
    <div data-testid="dom-fixture-root" style={fixtureShell}>
      <div style={buttonRow}>
        <ToggleButton testId="btn-dom05-swap" present={key === 'A'} onToggle={() => setKey(k => (k === 'A' ? 'B' : 'A'))}>
          Swap keyed child (now {key})
        </ToggleButton>
      </div>

      <section>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Born closed</h3>
        <div data-testid="dom02-slot">
          <Presence present={false}>
            <div
              data-testid="dom02-child"
              ref={node => {
                dom02Log.current.push(node ? 'attach' : 'detach')
              }}
            >
              Born closed content
            </div>
          </Presence>
        </div>
      </section>

      <section>
        <h3 style={{ margin: '12px 0 8px 0', fontSize: '14px' }}>Empty children</h3>
        {emptyVariants.map((v, i) => (
          <div key={v.label} data-testid={`dom03-slot-${i}`} data-variant={v.label}>
            <Presence present={v.present}>{v.child}</Presence>
          </div>
        ))}
      </section>

      <section>
        <h3 style={{ margin: '12px 0 8px 0', fontSize: '14px' }}>
          Passthrough (<span data-testid="dom04-clicks">{clicks}</span>)
        </h3>
        <div data-testid="dom04-slot">
          <Presence present={true}>
            <div
              data-testid="dom04-child"
              id="dom04-authored-id"
              className="dom04-authored-class"
              data-state="open"
              data-custom="authored"
              style={{ color: 'rgb(1, 2, 3)', padding: '12px' }}
              onClick={() => setClicks(c => c + 1)}
            >
              Passthrough content
            </div>
          </Presence>
        </div>
      </section>

      <section>
        <h3 style={{ margin: '12px 0 8px 0', fontSize: '14px' }}>Keyed swap</h3>
        <div data-testid="dom05-slot">
          <Presence present={true}>
            <div
              key={key}
              data-testid={`dom05-child-${key}`}
              ref={key === 'A' ? refA : refB}
            >
              Keyed content {key}
            </div>
          </Presence>
        </div>
      </section>
    </div>
  )
}

export function PresenceInstantFixture() {
  const [boxes, setBoxes] = React.useState({
    i02: true,
    i03a: true,
    i03b: true,
    i04: true,
    i05: true,
    i06: true,
    i07: true,
  })
  const toggle = (k: keyof typeof boxes) => setBoxes(b => ({ ...b, [k]: !b[k] }))

  return (
    <div data-testid="instant-fixture-root" style={fixtureShell}>
      <style>{`
        @keyframes instantEnter { from { opacity: 0; } to { opacity: 1; } }
        @keyframes instantExit { from { opacity: 1; } to { opacity: 0; } }
        .i02 { transition: opacity 0s; opacity: 1; padding: 12px; background: #e0f2fe; }
        .i02[data-state="closed"] { opacity: 0; }
        .i03a[data-state="open"] { animation: instantEnter 300ms; padding: 12px; background: #fef3c7; }
        .i03a[data-state="closed"] { animation-name: none; padding: 12px; background: #fef3c7; }
        .i03b { padding: 12px; background: #fef3c7; }
        .i03b[data-state="closed"] { animation: instantExit 0s; }
        .i04 { transition: opacity 0s, transform 0s; animation: instantExit 0s; opacity: 1; padding: 12px; background: #f3e8ff; }
        .i04[data-state="closed"] { opacity: 0; transform: translateY(-4px); }
        .i05 { transition: opacity 300ms ease; opacity: 1; padding: 12px; background: #dcfce7; }
        .i05[data-state="closed"] { opacity: 0; }
        @media (prefers-reduced-motion: reduce) {
          .i05[data-state="closed"] { transition-duration: 0s; }
        }
        .i06 { transition: opacity 300ms ease; opacity: 1; padding: 12px; background: #fee2e2; }
        .i06[data-state="closed"] { opacity: 0; }
        .i07 { transition: opacity 300ms ease; opacity: 1; padding: 12px; background: #ffedd5; }
        .i07[data-state="closed"] { display: none; }
      `}</style>

      <div style={buttonRow}>
        {(Object.keys(boxes) as Array<keyof typeof boxes>).map(k => (
          <ToggleButton key={k} testId={`btn-toggle-${k}`} present={boxes[k]} onToggle={() => toggle(k)}>
            Toggle {k}
          </ToggleButton>
        ))}
      </div>

      <Presence present={boxes.i02}>
        <div data-testid="instant-i02" className="i02" data-state={boxes.i02 ? 'open' : 'closed'}>
          Zero-duration transition
        </div>
      </Presence>
      <Presence present={boxes.i03a}>
        <div data-testid="instant-i03a" className="i03a" data-state={boxes.i03a ? 'open' : 'closed'}>
          Animation-name none
        </div>
      </Presence>
      <Presence present={boxes.i03b}>
        <div data-testid="instant-i03b" className="i03b" data-state={boxes.i03b ? 'open' : 'closed'}>
          Zero-duration animation
        </div>
      </Presence>
      <Presence present={boxes.i04}>
        <div data-testid="instant-i04" className="i04" data-state={boxes.i04 ? 'open' : 'closed'}>
          All-zero effects
        </div>
      </Presence>
      <Presence present={boxes.i05}>
        <div data-testid="instant-i05" className="i05" data-state={boxes.i05 ? 'open' : 'closed'}>
          Reduced-motion zero
        </div>
      </Presence>
      <Presence present={boxes.i06}>
        <div data-testid="instant-i06" className="i06" data-state={boxes.i06 ? 'open' : 'closed'}>
          Hidden document
        </div>
      </Presence>
      <Presence present={boxes.i07}>
        <div data-testid="instant-i07" className="i07" data-state={boxes.i07 ? 'open' : 'closed'}>
          Display none
        </div>
      </Presence>
    </div>
  )
}

export function PresenceTransitionFixture() {
  const [t02, setT02] = React.useState(true)
  const [t03, setT03] = React.useState(true)
  const [t04, setT04] = React.useState(true)
  const [t05, setT05] = React.useState(true)
  const [t06, setT06] = React.useState(true)

  return (
    <div data-testid="transition-fixture-root" style={fixtureShell}>
      <style>{`
        .t02 { transition: opacity 200ms ease 100ms; opacity: 1; padding: 12px; background: #e0f2fe; }
        .t02[data-state="closed"] { opacity: 0; }
        .t03 { transition: opacity 100ms ease, transform 300ms ease; opacity: 1; transform: translateY(0); padding: 12px; background: #fef3c7; }
        .t03[data-state="closed"] { opacity: 0; transform: translateY(-20px); }
        .t04 { transition: opacity 300ms ease; opacity: 1; padding: 12px; background: #f3e8ff; }
        .t04[data-state="closed"] { opacity: 0; }
        .t04-child { transition: transform 100ms ease; transform: scale(1); padding: 8px; background: #ede9fe; }
        .t04-child[data-state="closed"] { transform: scale(0.5); }
        .t05 { transition: opacity 300ms ease; opacity: 1; padding: 12px; background: #fee2e2; }
        .t05[data-state="closed"] { opacity: 0; }
        .t06 { transition: color 100s linear, opacity 200ms ease; opacity: 1; color: black; padding: 12px; background: #ffedd5; }
        .t06[data-state="closed"] { opacity: 0; }
      `}</style>

      <div style={buttonRow}>
        <ToggleButton testId="btn-toggle-t02" present={t02} onToggle={() => setT02(p => !p)}>Toggle T02</ToggleButton>
        <ToggleButton testId="btn-toggle-t03" present={t03} onToggle={() => setT03(p => !p)}>Toggle T03</ToggleButton>
        <ToggleButton testId="btn-toggle-t04" present={t04} onToggle={() => setT04(p => !p)}>Toggle T04</ToggleButton>
        <ToggleButton testId="btn-toggle-t05" present={t05} onToggle={() => setT05(p => !p)}>Toggle T05</ToggleButton>
        <ToggleButton testId="btn-toggle-t06" present={t06} onToggle={() => setT06(p => !p)}>Toggle T06</ToggleButton>
      </div>

      <Presence present={t02}>
        <div data-testid="trans-t02" className="t02" data-state={t02 ? 'open' : 'closed'}>
          Delayed transition
        </div>
      </Presence>
      <Presence present={t03}>
        <div data-testid="trans-t03" className="t03" data-state={t03 ? 'open' : 'closed'}>
          Multi-property transition
        </div>
      </Presence>
      <Presence present={t04}>
        <div data-testid="trans-t04" className="t04" data-state={t04 ? 'open' : 'closed'}>
          Parent transition
          <div data-testid="trans-t04-child" className="t04-child" data-state={t04 ? 'open' : 'closed'}>
            Descendant transition
          </div>
        </div>
      </Presence>
      <Presence present={t05}>
        <div data-testid="trans-t05" className="t05" data-state={t05 ? 'open' : 'closed'}>
          Canceled transition
        </div>
      </Presence>
      <Presence present={t06}>
        <div data-testid="trans-t06" className="t06" data-state={t06 ? 'open' : 'closed'}>
          Perpetual sibling transition
        </div>
      </Presence>
    </div>
  )
}

export function PresenceAnimationFixture() {
  const [a02, setA02] = React.useState(true)
  const [a03, setA03] = React.useState(true)
  const [a04, setA04] = React.useState(true)
  const [a05, setA05] = React.useState(true)
  const [a06, setA06] = React.useState(true)
  const [a07a, setA07a] = React.useState(true)
  const [a07b, setA07b] = React.useState(true)

  return (
    <div data-testid="animation-fixture-root" style={fixtureShell}>
      <style>{`
        @keyframes animFadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes animSlideOut { from { transform: translateY(0); } to { transform: translateY(-20px); } }
        @keyframes animPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        .a02 { padding: 12px; background: #e0f2fe; }
        .a02[data-state="closed"] { animation: animFadeOut 100ms ease 100ms 2 backwards; }
        .a03 { padding: 12px; background: #fef3c7; }
        .a03[data-state="closed"] { animation: animFadeOut 200ms ease, animSlideOut 400ms ease; }
        .a04[data-state="open"] { animation: animPulse 1s infinite; padding: 12px; background: #f3e8ff; }
        .a04[data-state="closed"] { animation: animPulse 1s infinite; padding: 12px; background: #f3e8ff; }
        .a05 { padding: 12px; background: #fee2e2; }
        .a05[data-state="closed"] { animation: animFadeOut 300ms ease; }
        .a06 { padding: 12px; background: #ffedd5; }
        .a06[data-state="closed"] { animation: animFadeOut 300ms ease; }
        .a06-child { padding: 8px; background: #fed7aa; }
        .a06-child[data-state="closed"] { animation: animSlideOut 100ms ease; }
        .a07a { padding: 12px; background: #dcfce7; }
        .a07a[data-state="closed"] { animation: animPulse 1s infinite; }
        .a07b { padding: 12px; background: #d1fae5; transition: transform 200ms ease; transform: translateY(0); }
        .a07b[data-state="closed"] { animation: animPulse 1s infinite; transform: translateY(-8px); }
      `}</style>

      <div style={buttonRow}>
        <ToggleButton testId="btn-toggle-a02" present={a02} onToggle={() => setA02(p => !p)}>Toggle A02</ToggleButton>
        <ToggleButton testId="btn-toggle-a03" present={a03} onToggle={() => setA03(p => !p)}>Toggle A03</ToggleButton>
        <ToggleButton testId="btn-toggle-a04" present={a04} onToggle={() => setA04(p => !p)}>Toggle A04</ToggleButton>
        <ToggleButton testId="btn-toggle-a05" present={a05} onToggle={() => setA05(p => !p)}>Toggle A05</ToggleButton>
        <ToggleButton testId="btn-toggle-a06" present={a06} onToggle={() => setA06(p => !p)}>Toggle A06</ToggleButton>
        <ToggleButton testId="btn-toggle-a07a" present={a07a} onToggle={() => setA07a(p => !p)}>Toggle A07a</ToggleButton>
        <ToggleButton testId="btn-toggle-a07b" present={a07b} onToggle={() => setA07b(p => !p)}>Toggle A07b</ToggleButton>
      </div>

      <Presence present={a02}>
        <div data-testid="anim-a02" className="a02" data-state={a02 ? 'open' : 'closed'}>
          Delayed iterations
        </div>
      </Presence>
      <Presence present={a03}>
        <div data-testid="anim-a03" className="a03" data-state={a03 ? 'open' : 'closed'}>
          Dual animations
        </div>
      </Presence>
      <Presence present={a04}>
        <div data-testid="anim-a04" className="a04" data-state={a04 ? 'open' : 'closed'}>
          Same-name animation
        </div>
      </Presence>
      <Presence present={a05}>
        <div data-testid="anim-a05" className="a05" data-state={a05 ? 'open' : 'closed'}>
          Canceled animation
        </div>
      </Presence>
      <Presence present={a06}>
        <div data-testid="anim-a06" className="a06" data-state={a06 ? 'open' : 'closed'}>
          Parent animation
          <div data-testid="anim-a06-child" className="a06-child" data-state={a06 ? 'open' : 'closed'}>
            Descendant animation
          </div>
        </div>
      </Presence>
      <Presence present={a07a}>
        <div data-testid="anim-a07a" className="a07a" data-state={a07a ? 'open' : 'closed'}>
          Infinite only
        </div>
      </Presence>
      <Presence present={a07b}>
        <div data-testid="anim-a07b" className="a07b" data-state={a07b ? 'open' : 'closed'}>
          Infinite plus finite
        </div>
      </Presence>
    </div>
  )
}

export function PresenceRaceFixture() {
  const [r01, setR01] = React.useState(true)
  const [r03, setR03] = React.useState(true)
  const [r03Count, setR03Count] = React.useState(0)
  const [r04, setR04] = React.useState(true)
  const [r05, setR05] = React.useState(true)
  const [r05HasChild, setR05HasChild] = React.useState(true)
  const [r06, setR06] = React.useState(true)
  const [r06Mounted, setR06Mounted] = React.useState(true)

  return (
    <div data-testid="race-fixture-root" style={fixtureShell}>
      <style>{`
        @keyframes raceFadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes raceEnter { from { opacity: 0; } to { opacity: 1; } }
        .r01 { transition: opacity 200ms ease; opacity: 1; padding: 12px; background: #e0f2fe; }
        .r01[data-state="closed"] { animation: raceFadeOut 400ms ease; opacity: 0; }
        .r03 { transition: opacity 300ms ease; opacity: 1; padding: 12px; background: #fef3c7; }
        .r03[data-state="closed"] { opacity: 0; }
        .r04[data-state="open"] { animation: raceEnter 500ms ease; padding: 12px; background: #f3e8ff; }
        .r04[data-state="closed"] { animation: raceFadeOut 200ms ease; padding: 12px; background: #f3e8ff; }
        .r05 { transition: opacity 300ms ease; opacity: 1; padding: 12px; background: #fee2e2; }
        .r05[data-state="closed"] { opacity: 0; }
        .r06 { transition: opacity 300ms ease; opacity: 1; padding: 12px; background: #ffedd5; }
        .r06[data-state="closed"] { opacity: 0; }
      `}</style>

      <div style={buttonRow}>
        <ToggleButton testId="btn-toggle-r01" present={r01} onToggle={() => setR01(p => !p)}>Toggle R01</ToggleButton>
        <ToggleButton testId="btn-toggle-r03" present={r03} onToggle={() => setR03(p => !p)}>Toggle R03</ToggleButton>
        <ToggleButton testId="btn-toggle-r04" present={r04} onToggle={() => setR04(p => !p)}>Toggle R04</ToggleButton>
        <ToggleButton testId="btn-toggle-r05" present={r05} onToggle={() => setR05(p => !p)}>Toggle R05</ToggleButton>
        <ToggleButton testId="btn-toggle-r05-child" present={r05HasChild} onToggle={() => setR05HasChild(p => !p)}>
          Toggle R05 child
        </ToggleButton>
        <ToggleButton testId="btn-toggle-r06" present={r06} onToggle={() => setR06(p => !p)}>Toggle R06</ToggleButton>
        <ToggleButton testId="btn-toggle-r06-mounted" present={r06Mounted} onToggle={() => setR06Mounted(p => !p)}>
          Toggle R06 mounted
        </ToggleButton>
      </div>

      <Presence present={r01}>
        <div data-testid="race-r01" className="r01" data-state={r01 ? 'open' : 'closed'}>
          Mixed effects
        </div>
      </Presence>

      <section>
        <h3 style={{ margin: '12px 0 8px 0', fontSize: '14px' }}>
          Reclose (<span data-testid="racecount-r03">{r03Count}</span>)
        </h3>
        <Presence present={r03} onExitComplete={() => setR03Count(c => c + 1)}>
          <div data-testid="race-r03" className="r03" data-state={r03 ? 'open' : 'closed'}>
            Reclose
          </div>
        </Presence>
      </section>

      <Presence present={r04}>
        <div data-testid="race-r04" className="r04" data-state={r04 ? 'open' : 'closed'}>
          Enter race
        </div>
      </Presence>

      <div data-testid="race-r05-slot">
        <Presence present={r05}>
          {r05HasChild ? (
            <div data-testid="race-r05" className="r05" data-state={r05 ? 'open' : 'closed'}>
              External removal
            </div>
          ) : null}
        </Presence>
      </div>

      <div data-testid="race-r06-slot">
        {r06Mounted ? (
          <Presence present={r06}>
            <div data-testid="race-r06" className="r06" data-state={r06 ? 'open' : 'closed'}>
              Presence unmount
            </div>
          </Presence>
        ) : null}
      </div>
    </div>
  )
}

export function PresenceNestExitFixture() {
  const [parentPresent, setParentPresent] = React.useState(true)
  const [childPresent, setChildPresent] = React.useState(true)
  const [childMounted, setChildMounted] = React.useState(true)
  const [parentCount, setParentCount] = React.useState(0)
  const [childCount, setChildCount] = React.useState(0)

  return (
    <div data-testid="nestexit-fixture-root" style={fixtureShell}>
      <style>{`
        .nestexit-parent { transition: opacity 150ms ease; opacity: 1; padding: 16px; background: #f3e8ff; border: 1px solid #a855f7; border-radius: 6px; }
        .nestexit-parent[data-state="closed"] { opacity: 0; }
        .nestexit-child { transition: transform 350ms ease; transform: scale(1); margin-top: 8px; padding: 10px; background: #ede9fe; border: 1px dashed #8b5cf6; border-radius: 4px; }
        .nestexit-child[data-state="closed"] { transform: scale(0.8); }
      `}</style>

      <div style={buttonRow}>
        <ToggleButton testId="btn-toggle-nestexit-parent" present={parentPresent} onToggle={() => setParentPresent(p => !p)}>
          Toggle parent
        </ToggleButton>
        <ToggleButton testId="btn-toggle-nestexit-child" present={childPresent} onToggle={() => setChildPresent(p => !p)}>
          Toggle child
        </ToggleButton>
        <ToggleButton testId="btn-toggle-nestexit-child-mounted" present={childMounted} onToggle={() => setChildMounted(p => !p)}>
          Toggle child mounted
        </ToggleButton>
      </div>

      <p style={{ fontSize: '12px' }}>
        Parent exits: <span data-testid="nestexitcount-parent">{parentCount}</span> / Child exits:{' '}
        <span data-testid="nestexitcount-child">{childCount}</span>
      </p>

      <Presence present={parentPresent} onExitComplete={() => setParentCount(c => c + 1)}>
        <div
          data-testid="nestexit-parent"
          className="nestexit-parent"
          data-state={parentPresent ? 'open' : 'closed'}
        >
          Parent Content
          {childMounted ? (
            <Presence present={childPresent} onExitComplete={() => setChildCount(c => c + 1)}>
              <div
                data-testid="nestexit-child"
                className="nestexit-child"
                data-state={childPresent ? 'open' : 'closed'}
              >
                Child Content
              </div>
            </Presence>
          ) : null}
        </div>
      </Presence>
    </div>
  )
}

export function PresenceCompFixture() {
  const [c01, setC01] = React.useState(true)
  const [c02, setC02] = React.useState(true)
  const [c02Count, setC02Count] = React.useState(0)
  const [c03, setC03] = React.useState(true)
  const [c03Count, setC03Count] = React.useState(0)
  // Render-time init + stable ref: attaches fire before effects, and an
  // inline ref would detach/attach on every re-render.
  const c01InitRef = React.useRef(false)
  if (!c01InitRef.current) {
    c01InitRef.current = true
    ;(window as any).__c01log = []
  }
  const c01Ref = React.useCallback((node: HTMLDivElement | null) => {
    ;((window as any).__c01log as string[]).push(node ? 'attach' : 'detach')
  }, [])

  return (
    <div data-testid="comp-fixture-root" style={fixtureShell}>
      <style>{`
        @keyframes compFade { from { opacity: 1; } to { opacity: 0; } }
        @keyframes compInner { from { transform: translateY(0); } to { transform: translateY(-8px); } }
        .c01 { padding: 12px; background: #e0f2fe; border: 1px solid #38bdf8; border-radius: 6px; }
        .c01[data-state="closed"] { animation: compFade 300ms ease; }
        .c02 { transition: transform 200ms ease 100ms; transform: translateX(0); padding: 12px; background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; }
        .c02[data-state="closed"] { transform: translateX(-20px); }
        .c02-inner { padding: 8px; background: #fde68a; }
        .c02-inner[data-state="closed"] { animation: compInner 100ms ease; }
        .c03 { transition: opacity 300ms ease; opacity: 1; padding: 12px; background: #dcfce7; border: 1px solid #22c55e; border-radius: 6px; }
        .c03[data-state="closed"] { opacity: 0; }
        @media (prefers-reduced-motion: reduce) {
          .c03[data-state="closed"] { transition-duration: 0s; }
        }
      `}</style>

      <div style={buttonRow}>
        <ToggleButton testId="btn-toggle-c01" present={c01} onToggle={() => setC01(p => !p)}>Toggle C01</ToggleButton>
        <ToggleButton testId="btn-toggle-c02" present={c02} onToggle={() => setC02(p => !p)}>Toggle C02</ToggleButton>
        <ToggleButton testId="btn-toggle-c03" present={c03} onToggle={() => setC03(p => !p)}>Toggle C03</ToggleButton>
      </div>

      <section>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Fade composition</h3>
        <div data-testid="comp-c01-slot">
          <Presence present={c01}>
            <div
              data-testid="comp-c01"
              className="c01"
              data-state={c01 ? 'open' : 'closed'}
              ref={c01Ref}
            >
              Fade content
            </div>
          </Presence>
        </div>
      </section>

      <section>
        <h3 style={{ margin: '12px 0 8px 0', fontSize: '14px' }}>
          Drawer composition (<span data-testid="compcount-c02">{c02Count}</span>)
        </h3>
        <Presence present={c02} onExitComplete={() => setC02Count(n => n + 1)}>
          <div data-testid="comp-c02" className="c02" data-state={c02 ? 'open' : 'closed'}>
            Drawer content
            <div data-testid="comp-c02-inner" className="c02-inner" data-state={c02 ? 'open' : 'closed'}>
              Inner descendant
            </div>
          </div>
        </Presence>
      </section>

      <section>
        <h3 style={{ margin: '12px 0 8px 0', fontSize: '14px' }}>
          Reduced-motion reopen (<span data-testid="compcount-c03">{c03Count}</span>)
        </h3>
        <Presence present={c03} onExitComplete={() => setC03Count(n => n + 1)}>
          <div data-testid="comp-c03" className="c03" data-state={c03 ? 'open' : 'closed'}>
            Reopen content
          </div>
        </Presence>
      </section>
    </div>
  )
}

export function PresenceGsapFixture() {
  const [present, setPresent] = React.useState(true)
  const [count, setCount] = React.useState(0)

  React.useEffect(() => {
    let cancelled = false
    import('../../motion/gsap').then(m => {
      if (!cancelled) (window as any).__presenceGsap = m.gsap
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div data-testid="gsap-fixture-root" style={fixtureShell}>
      <div style={buttonRow}>
        <ToggleButton testId="btn-toggle-gsap" present={present} onToggle={() => setPresent(p => !p)}>
          Toggle GSAP
        </ToggleButton>
      </div>

      <p style={{ fontSize: '12px' }}>
        Exits: <span data-testid="gsapcount">{count}</span>
      </p>

      <Presence present={present} onExitComplete={() => setCount(c => c + 1)}>
        <div data-testid="gsap-box" data-state={present ? 'open' : 'closed'} style={boxBase}>
          GSAP content
        </div>
      </Presence>
    </div>
  )
}
