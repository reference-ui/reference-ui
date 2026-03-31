import { Div } from '@reference-ui/react'

/**
 * Core system: `container` + `r` props (container queries, responsive overrides).
 * Anonymous: outer establishes context; inner `r` queries nearest ancestor.
 * Named: `container="name"` on the ancestor + matching `container` + `r` on descendants.
 */
export default function ResponsiveContainerTest() {
  return (
    <div data-testid="responsive-container-test">
      <section>
        <h2>Anonymous container</h2>
        <p>Outer establishes container; inner uses `r` only.</p>
        <Div
          container
          data-testid="anonymous-shell"
          style={{ width: '180px', border: '1px solid #cbd5e1' }}
        >
          <Div
            data-testid="anonymous-target"
            r={{
              400: { padding: '20px', backgroundColor: '#dbeafe' },
            }}
          >
            Anonymous responsive
          </Div>
        </Div>
      </section>

      <section>
        <h2>Named containers</h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Div
            container="sidebar"
            data-testid="sidebar-shell"
            style={{ width: '180px', minHeight: '100px', border: '1px solid #cbd5e1' }}
          >
            <Div
              container="sidebar"
              data-testid="sidebar-target"
              r={{
                200: { backgroundColor: '#2563eb', color: '#ffffff', padding: '12px' },
              }}
            >
              Sidebar
            </Div>
          </Div>

          <Div
            container="card"
            data-testid="card-shell"
            style={{ width: '260px', border: '1px solid #86efac' }}
          >
            <div style={{ padding: '24px' }}>
              <Div
                container="card"
                data-testid="card-target"
                r={{
                  300: { backgroundColor: '#16a34a', color: '#ffffff', padding: '12px' },
                }}
              >
                Card nested
              </Div>
            </div>
          </Div>
        </div>
      </section>
    </div>
  )
}
