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
