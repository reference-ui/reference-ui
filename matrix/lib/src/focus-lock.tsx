import * as React from 'react'
import { FocusLock } from '@reference-ui/lib'

export function FocusLockFixture() {
  const [active, setActive] = React.useState(false)
  const shardRef = React.useRef<HTMLDivElement | null>(null)

  return (
    <div data-testid="focus-lock-fixture-root">
      <h1>FocusLock Fixture</h1>

      {/* Outside triggers and controls */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          type="button"
          data-testid="btn-trigger"
          onClick={() => setActive(true)}
        >
          Open Lock
        </button>
        <button
          type="button"
          data-testid="outside-button"
        >
          Outside Button
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
            <input
              type="text"
              data-testid="lock-input-middle"
              placeholder="Middle Input"
            />
            <button type="button" data-testid="lock-btn-last">
              Last Button
            </button>

            <button
              type="button"
              data-testid="btn-close-lock"
              onClick={() => setActive(false)}
            >
              Close Lock
            </button>
          </div>
        </FocusLock>
      )}

      {/* External Shard */}
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
