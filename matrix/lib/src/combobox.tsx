import * as React from 'react'
import { Combobox, Listbox } from '@reference-ui/lib'

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
            <Listbox>
              <Listbox.Option value="apple" data-testid="combo-opt-apple">
                Apple
              </Listbox.Option>
              <Listbox.Option value="banana" data-testid="combo-opt-banana">
                Banana
              </Listbox.Option>
              <Listbox.Option value="cherry" data-testid="combo-opt-cherry">
                Cherry
              </Listbox.Option>
            </Listbox>
          </Combobox.Popover>
        </Combobox>
      </div>

      <p data-testid="combobox-value-display">
        Selected: {value ?? 'None'}
      </p>
    </div>
  )
}
