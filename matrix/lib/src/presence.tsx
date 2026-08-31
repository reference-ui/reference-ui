import * as React from 'react'
import { Presence } from '@reference-ui/lib'

export function PresenceFixture() {
  const [instantPresent, setInstantPresent] = React.useState(true)
  const [transitionPresent, setTransitionPresent] = React.useState(true)
  const [animationPresent, setAnimationPresent] = React.useState(true)
  const [nestedParentPresent, setNestedParentPresent] = React.useState(true)
  const [nestedChildPresent, setNestedChildPresent] = React.useState(true)

  return (
    <div data-testid="presence-fixture-root">
      <h1>Presence Fixture</h1>

      <style>{`
        .transition-box {
          transition: opacity 300ms ease, transform 300ms ease;
          opacity: 1;
          transform: translateY(0);
        }
        .transition-box[data-state="closed"] {
          opacity: 0;
          transform: translateY(-20px);
        }

        @keyframes fadeOutAnimation {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        .animation-box[data-state="open"] {
          opacity: 1;
        }
        .animation-box[data-state="closed"] {
          animation: fadeOutAnimation 300ms forwards;
        }

        .nested-parent[data-state="closed"] {
          transition: opacity 150ms ease;
          opacity: 0;
        }
        .nested-child[data-state="closed"] {
          transition: transform 350ms ease;
          transform: scale(0.8);
        }
      `}</style>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          type="button"
          data-testid="btn-toggle-instant"
          onClick={() => setInstantPresent(p => !p)}
        >
          Toggle Instant
        </button>
        <button
          type="button"
          data-testid="btn-toggle-transition"
          onClick={() => setTransitionPresent(p => !p)}
        >
          Toggle Transition
        </button>
        <button
          type="button"
          data-testid="btn-toggle-animation"
          onClick={() => setAnimationPresent(p => !p)}
        >
          Toggle Animation
        </button>
        <button
          type="button"
          data-testid="btn-toggle-nested-parent"
          onClick={() => setNestedParentPresent(p => !p)}
        >
          Toggle Nested Parent
        </button>
        <button
          type="button"
          data-testid="btn-toggle-nested-child"
          onClick={() => setNestedChildPresent(p => !p)}
        >
          Toggle Nested Child
        </button>
      </div>

      {/* 1. Instant Exit */}
      <section>
        <h2>Instant Exit</h2>
        <Presence present={instantPresent}>
          <div data-testid="instant-box">Instant Content</div>
        </Presence>
      </section>

      {/* 2. Transition Exit */}
      <section>
        <h2>Transition Exit</h2>
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
        <h2>Animation Exit</h2>
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
        <h2>Nested Presence</h2>
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
  )
}
