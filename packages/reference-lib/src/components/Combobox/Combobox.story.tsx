import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { ReferenceLibrary } from '../ReferenceLibrary'
import { Combobox } from './index'
import { Listbox } from '../Listbox'

export const FruitSelect = () => {
  const [value, setValue] = React.useState<string | null>(null)

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="combobox-fixture-root">
        <Div style={{ width: 240, margin: '16px 0' }}>
          <Combobox value={value} onChange={setValue}>
            <Combobox.Input
              data-testid="combobox-input"
              placeholder="Select a fruit..."
            />
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
        </Div>

        <Span fontSize="3r" color="design.text.light" data-testid="combobox-value-display">
          Selected: {value ?? 'None'}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}
