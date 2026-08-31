import * as React from 'react'
import { Portal, type PortalContainer } from '@reference-ui/lib'

const TestContext = React.createContext('default')

export function PortalFixture() {
  const customTargetRef = React.useRef<HTMLDivElement | null>(null)
  const [targetResolved, setTargetResolved] = React.useState(false)
  const [currentDestination, setCurrentDestination] = React.useState<'A' | 'B'>('A')
  const [clickCount, setClickCount] = React.useState(0)

  const dynamicRef = React.useRef<HTMLDivElement | null>(null)

  return (
    <TestContext.Provider value="logical-provider-value">
      <div
        data-testid="portal-fixture-root"
        onClick={() => setClickCount(c => c + 1)}
      >
        <h1>Portal Fixture</h1>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            type="button"
            data-testid="btn-resolve-target"
            onClick={() => setTargetResolved(true)}
          >
            Resolve Target
          </button>
          <button
            type="button"
            data-testid="btn-switch-destination"
            onClick={() => setCurrentDestination(d => (d === 'A' ? 'B' : 'A'))}
          >
            Switch Destination
          </button>
        </div>

        <div data-testid="logical-parent">
          {/* 1. Default Body Portal */}
          <Portal>
            <div data-testid="body-portalled-node">Body Portalled Content</div>
          </Portal>

          {/* 2. Explicit Null Container (defaults to body) */}
          <Portal container={null}>
            <div data-testid="explicit-null-portalled-node">
              Explicit Null Content
            </div>
          </Portal>

          {/* 3. Ref Destination (initially unresolved) */}
          <Portal container={dynamicRef}>
            <div data-testid="ref-portalled-node">Ref Portalled Content</div>
          </Portal>

          {/* 4. Context & Event Bubble Portal */}
          <Portal container={customTargetRef}>
            <ChildWithContext />
          </Portal>
        </div>

        {/* Destination Containers */}
        <section>
          <h2>Custom Destination Ref</h2>
          <div
            ref={customTargetRef}
            data-testid="custom-destination-container"
            style={{ border: '1px solid blue', padding: '8px' }}
          />
        </section>

        <section>
          <h2>Dynamic Late Destination</h2>
          {targetResolved && (
            <div
              ref={dynamicRef}
              data-testid="dynamic-resolved-container"
              style={{ border: '1px solid green', padding: '8px' }}
            />
          )}
        </section>

        <section>
          <h2>Switchable Destinations</h2>
          <div
            id="target-a"
            data-testid="target-a"
            style={{ border: '1px solid red', padding: '8px', marginBottom: '8px' }}
          />
          <div
            id="target-b"
            data-testid="target-b"
            style={{ border: '1px solid purple', padding: '8px' }}
          />

          <SwitchablePortal destination={currentDestination} />
        </section>

        <div data-testid="parent-click-count">{clickCount}</div>
      </div>
    </TestContext.Provider>
  )
}

function ChildWithContext() {
  const contextVal = React.useContext(TestContext)
  return (
    <button
      type="button"
      data-testid="context-and-event-btn"
      data-context-val={contextVal}
    >
      Click Me ({contextVal})
    </button>
  )
}

function SwitchablePortal({ destination }: { destination: 'A' | 'B' }) {
  const [container, setContainer] = React.useState<PortalContainer | null>(null)

  React.useLayoutEffect(() => {
    const el = document.getElementById(destination === 'A' ? 'target-a' : 'target-b')
    setContainer(el)
  }, [destination])

  if (!container) return null

  return (
    <Portal container={container}>
      <div data-testid="switchable-portalled-node">
        Currently in Target {destination}
      </div>
    </Portal>
  )
}
