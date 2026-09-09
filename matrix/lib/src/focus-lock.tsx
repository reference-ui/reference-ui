import * as React from 'react'
import { FocusLock } from '@reference-ui/lib'

export function FocusLockFixture() {
  const [active, setActive] = React.useState(false)
  const [nested, setNested] = React.useState(false)
  const [catalog, setCatalog] = React.useState(false)
  const [shadow, setShadow] = React.useState(false)
  const [proximity, setProximity] = React.useState(false)
  const [openerRemoved, setOpenerRemoved] = React.useState(false)
  const shardRef = React.useRef<HTMLDivElement | null>(null)
  const shadowHostRef = React.useRef<HTMLDivElement | null>(null)

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
                  <button type="button" data-testid="btn-close-inner-lock" onClick={() => setNested(false)}>
                    Close inner
                  </button>
                </div>
              </FocusLock>
            )}
          </div>
        </FocusLock>
      )}

      {catalog && (
        <FocusLock>
          <form data-testid="catalog-lock" style={{ border: '2px solid purple', padding: 16 }}>
            <button type="button" data-testid="catalog-btn">Catalog button</button>
            <input data-testid="catalog-input" />
            <select data-testid="catalog-select">
              <option>One</option>
            </select>
            <textarea data-testid="catalog-textarea" />
            <a href="#catalog" data-testid="catalog-link">
              Link
            </a>
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
            <button type="button" data-testid="btn-close-catalog" onClick={() => setCatalog(false)}>
              Close catalog
            </button>
          </form>
        </FocusLock>
      )}

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
    </div>
  )
}
