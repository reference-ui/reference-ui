import * as React from 'react'
import { Listbox } from '@reference-ui/lib'

export function ListboxFixture() {
  const [value, setValue] = React.useState<string | null>('apple')

  return (
    <div data-testid="listbox-fixture-root">
      <h1>Listbox Fixture</h1>

      <div style={{ width: 240, margin: '16px 0' }}>
        <Listbox
          data-testid="test-listbox"
          value={value}
          onChange={setValue}
        >
          <Listbox.Option value="apple" data-testid="opt-apple">
            Apple
          </Listbox.Option>
          <Listbox.Option value="banana" data-testid="opt-banana">
            Banana
          </Listbox.Option>
          <Listbox.Option value="cherry" data-testid="opt-cherry">
            Cherry
          </Listbox.Option>
        </Listbox>
      </div>

      <p data-testid="listbox-value-display">
        Selected: {value ?? 'None'}
      </p>
    </div>
  )
}
