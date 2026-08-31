import * as React from 'react'
import { Switch } from '@reference-ui/lib'

export function SwitchFixture() {
  const [checked, setChecked] = React.useState(false)
  const [disabled, setDisabled] = React.useState(false)

  return (
    <div data-testid="switch-fixture-root">
      <h1>Switch Fixture</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '16px 0' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Notifications</span>
          <Switch
            data-testid="test-switch"
            checked={checked}
            onChange={setChecked}
            disabled={disabled}
          />
        </label>

        <div>
          <button
            type="button"
            data-testid="btn-toggle-disabled"
            onClick={() => setDisabled(d => !d)}
          >
            Toggle Disabled
          </button>
        </div>
      </div>
    </div>
  )
}
