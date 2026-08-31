import * as React from 'react'
import { Combobox } from '@reference-ui/lib'

export function ComboboxFixture() {
  const [value, setValue] = React.useState<string | null>(null)

  return (
    <div data-testid="combobox-fixture-root">
      <h1>Combobox Fixture</h1>

      <div style={{ width: 240, margin: '16px 0' }}>
        <Combobox
          value={value}
          onChange={setValue}
        >
          <Combobox.Input data-testid="combobox-input" placeholder="Select a fruit..." />

          <Combobox.Popover data-testid="combobox-popover">
            <Combobox.Option value="apple" data-testid="combo-opt-apple">
              Apple
            </Combobox.Option>
            <Combobox.Option value="banana" data-testid="combo-opt-banana">
              Banana
            </Combobox.Option>
            <Combobox.Option value="cherry" data-testid="combo-opt-cherry">
              Cherry
            </Combobox.Option>
          </Combobox.Popover>
        </Combobox>
      </div>

      <p data-testid="combobox-value-display">
        Selected: {value ?? 'None'}
      </p>
    </div>
  )
}
