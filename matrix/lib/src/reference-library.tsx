import * as React from 'react'
import {
  ReferenceLibrary,
  toast,
  announce,
} from '@reference-ui/lib'

export function ReferenceLibraryFixture() {
  const [showStandby, setShowStandby] = React.useState(true)
  const [showPrimary, setShowPrimary] = React.useState(true)

  return (
    <div data-testid="ref-library-fixture-root">
      <h1>ReferenceLibrary Fixture</h1>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          type="button"
          data-testid="btn-show-toast"
          onClick={() => {
            toast.show(<span>Saved Draft Successfully</span>, { id: 'toast-save' })
          }}
        >
          Show Toast
        </button>

        <button
          type="button"
          data-testid="btn-announce"
          onClick={() => {
            announce('File uploaded completely', { politeness: 'polite' })
          }}
        >
          Announce Polite
        </button>

        <button
          type="button"
          data-testid="btn-toggle-primary"
          onClick={() => setShowPrimary(p => !p)}
        >
          Toggle Primary Host
        </button>

        <button
          type="button"
          data-testid="btn-toggle-standby"
          onClick={() => setShowStandby(p => !p)}
        >
          Toggle Standby Host
        </button>
      </div>

      {/* Primary Root */}
      {showPrimary && (
        <div id="root-primary" data-testid="root-primary">
          <ReferenceLibrary>
            <main data-testid="app-primary">
              <h2>Primary Application Root</h2>
            </main>
          </ReferenceLibrary>
        </div>
      )}

      {/* Standby Root */}
      {showStandby && (
        <div id="root-standby" data-testid="root-standby">
          <ReferenceLibrary>
            <main data-testid="app-standby">
              <h2>Standby Application Root</h2>
            </main>
          </ReferenceLibrary>
        </div>
      )}
    </div>
  )
}
