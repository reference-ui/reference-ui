import * as React from 'react'
import { Div } from '@reference-ui/react'
import { Portal, type PortalContainer } from '@reference-ui/lib'

const TestContext = React.createContext('default')

export function PortalFixture() {
  const customTargetRef = React.useRef<HTMLDivElement | null>(null)
  const [targetResolved, setTargetResolved] = React.useState(false)
  const [currentDestination, setCurrentDestination] = React.useState<'A' | 'B'>('A')
  const [clickCount, setClickCount] = React.useState(0)

  const dynamicRef = React.useRef<HTMLDivElement | null>(null)

  // Theme test state
  const [docOnlyMounted, setDocOnlyMounted] = React.useState(false)
  const [islandOpen, setIslandOpen] = React.useState(false)
  const [liveRootTheme, setLiveRootTheme] = React.useState<'light' | 'dark'>('light')
  const [livePortalOpen, setLivePortalOpen] = React.useState(false)

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

        {/* Theme Proofs Section */}
        <section data-testid="portal-theme-section" style={{ marginTop: 32 }}>
          <h2>Theme &amp; Layer Scope Proofs</h2>

          {/* PT-THEME-01: Bare Portal in Dark Scope */}
          <Div colorMode="dark" data-testid="portal-theme-dark-parent">
            <Portal>
              <Div
                data-testid="portal-theme-dark-node"
                bg="ui.dialog.background"
                color="ui.dialog.foreground"
              >
                Dark Portaled Child
              </Div>
            </Portal>
          </Div>

          {/* PT-THEME-02: Bare Portal in Light Scope */}
          <Div colorMode="light" data-testid="portal-theme-light-parent">
            <Portal>
              <Div
                data-testid="portal-theme-light-node"
                bg="ui.dialog.background"
                color="ui.dialog.foreground"
              >
                Light Portaled Child
              </Div>
            </Portal>
          </Div>

          {/* PT-THEME-03: Nested Portal under Dark */}
          <Div colorMode="dark" data-testid="portal-nested-dark-parent">
            <Portal>
              <Div
                data-testid="portal-nested-outer"
                bg="ui.dialog.background"
                color="ui.dialog.foreground"
              >
                Nested Outer
                <Portal>
                  <Div
                    data-testid="portal-nested-inner"
                    bg="ui.dialog.background"
                    color="ui.dialog.foreground"
                  >
                    Nested Inner
                  </Div>
                </Portal>
              </Div>
            </Portal>
          </Div>

          {/* PT-THEME-04: Document-Only Color Mode (No React Context) */}
          <button
            type="button"
            data-testid="btn-mount-doc-only"
            onClick={() => setDocOnlyMounted(true)}
          >
            Mount Doc Only Portal
          </button>
          {docOnlyMounted && (
            <Portal>
              <Div
                data-testid="portal-doc-only-node"
                bg="ui.dialog.background"
                color="ui.dialog.foreground"
              >
                Doc Only Portaled Child
              </Div>
            </Portal>
          )}

          {/* PT-THEME-05: Island: light app with dark ancestor */}
          <Div colorMode="light" data-testid="portal-island-light-app">
            <Div colorMode="dark" data-testid="portal-island-dark-scope">
              <button
                type="button"
                data-testid="btn-open-island-portal"
                onClick={() => setIslandOpen(true)}
              >
                Open Island Portal
              </button>
              {islandOpen && (
                <Portal>
                  <Div
                    data-testid="portal-island-content"
                    bg="ui.dialog.background"
                    color="ui.dialog.foreground"
                  >
                    Island Portaled Content
                  </Div>
                </Portal>
              )}
            </Div>
          </Div>

          {/* PT-THEME-06: Live theme toggle on root without remount */}
          <Div colorMode={liveRootTheme} data-testid="portal-live-root">
            <button
              type="button"
              data-testid="btn-toggle-live-root-theme"
              onClick={() => setLiveRootTheme(t => (t === 'light' ? 'dark' : 'light'))}
            >
              Toggle Live Root Theme ({liveRootTheme})
            </button>
            <button
              type="button"
              data-testid="btn-open-live-portal"
              onClick={() => setLivePortalOpen(true)}
            >
              Open Live Portal
            </button>
            {livePortalOpen && (
              <Portal>
                <Div
                  data-testid="portal-live-content"
                  bg="ui.dialog.background"
                  color="ui.dialog.foreground"
                >
                  <span data-testid="portal-live-text">Live Portaled Content</span>
                </Div>
              </Portal>
            )}
          </Div>
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
