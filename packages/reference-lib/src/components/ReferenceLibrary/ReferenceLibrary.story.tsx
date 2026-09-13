import * as React from 'react'
import { ReferenceLibrary } from './ReferenceLibrary'
import { toast } from '../Toast'
import { announce } from '../Announcer'

export function ReferenceLibraryFixture() {
  const [showStandby, setShowStandby] = React.useState(true)
  const [showPrimary, setShowPrimary] = React.useState(true)

  return (
    <div
      data-testid="ref-library-fixture-root"
      style={{
        padding: '24px',
        fontFamily: 'sans-serif',
        maxWidth: '700px',
      }}
    >
      <h2 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>ReferenceLibrary Fixture</h2>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        <button
          type="button"
          data-testid="btn-show-toast"
          onClick={() => {
            toast.show(<span>Saved Draft Successfully</span>, { id: 'toast-save' })
          }}
          style={{ padding: '6px 12px', cursor: 'pointer' }}
        >
          Show Toast
        </button>

        <button
          type="button"
          data-testid="btn-announce"
          onClick={() => {
            announce('File uploaded completely', { politeness: 'polite' })
          }}
          style={{ padding: '6px 12px', cursor: 'pointer' }}
        >
          Announce Polite
        </button>

        <button
          type="button"
          data-testid="btn-toggle-primary"
          onClick={() => setShowPrimary(p => !p)}
          style={{ padding: '6px 12px', cursor: 'pointer' }}
        >
          Toggle Primary Host
        </button>

        <button
          type="button"
          data-testid="btn-toggle-standby"
          onClick={() => setShowStandby(p => !p)}
          style={{ padding: '6px 12px', cursor: 'pointer' }}
        >
          Toggle Standby Host
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Primary Root */}
        {showPrimary && (
          <div
            id="root-primary"
            data-testid="root-primary"
            style={{
              padding: '16px',
              border: '1px solid #94a3b8',
              borderRadius: '8px',
              background: '#f8fafc',
            }}
          >
            <ReferenceLibrary>
              <main data-testid="app-primary">
                <h3 style={{ margin: 0, fontSize: '14px', color: '#0f172a' }}>
                  Primary Application Root
                </h3>
              </main>
            </ReferenceLibrary>
          </div>
        )}

        {/* Standby Root */}
        {showStandby && (
          <div
            id="root-standby"
            data-testid="root-standby"
            style={{
              padding: '16px',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              background: '#f1f5f9',
            }}
          >
            <ReferenceLibrary>
              <main data-testid="app-standby">
                <h3 style={{ margin: 0, fontSize: '14px', color: '#334155' }}>
                  Standby Application Root
                </h3>
              </main>
            </ReferenceLibrary>
          </div>
        )}
      </div>
    </div>
  )
}
