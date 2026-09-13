import * as React from 'react'
import { Div, Button, Span } from '@reference-ui/react'
import { ReferenceLibrary } from '../ReferenceLibrary'
import { Switch } from './index'

export const InteractiveFixture = () => {
  const [checked, setChecked] = React.useState(false)
  const [disabled, setDisabled] = React.useState(false)

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="switch-fixture-root" display="flex" flexDirection="column" gap="4r">
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Span>Notifications</Span>
          <Switch
            data-testid="test-switch"
            checked={checked}
            onChange={setChecked}
            disabled={disabled}
          />
        </label>

        <div>
          <Button
            type="button"
            data-testid="btn-toggle-disabled"
            onClick={() => setDisabled(d => !d)}
          >
            Toggle Disabled
          </Button>
        </div>
      </Div>
    </ReferenceLibrary>
  )
}

export const StatesFixture = () => (
  <ReferenceLibrary>
    <Div p="4r" display="flex" flexDirection="column" gap="4r" data-testid="switch-states">
      <Div display="flex" alignItems="center" gap="3r">
        <Switch defaultChecked={false} />
        <Span>Unchecked</Span>
      </Div>
      <Div display="flex" alignItems="center" gap="3r">
        <Switch defaultChecked={true} />
        <Span>Checked</Span>
      </Div>
      <Div display="flex" alignItems="center" gap="3r">
        <Switch disabled checked={false} />
        <Span color="design.text.light">Disabled Unchecked</Span>
      </Div>
      <Div display="flex" alignItems="center" gap="3r">
        <Switch disabled checked={true} />
        <Span color="design.text.light">Disabled Checked</Span>
      </Div>
    </Div>
  </ReferenceLibrary>
)
