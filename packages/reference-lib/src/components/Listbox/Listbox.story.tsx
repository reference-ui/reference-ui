import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { ReferenceLibrary } from '../ReferenceLibrary'
import { Listbox } from './index'

export const Basic = () => {
  const [value, setValue] = React.useState<string | null>('apple')

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="listbox-fixture-root" maxW="80r">
        <Div width="60r" mb="4r">
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
            <Listbox.Option value="durian" data-testid="opt-disabled" disabled>
              Durian (disabled)
            </Listbox.Option>
          </Listbox>
        </Div>

        <Span data-testid="listbox-value-display" fontSize="3.5r" color="design.text.base">
          Selected: {value ?? 'None'}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const Multiple = () => {
  const [value, setValue] = React.useState<string[]>(['email'])

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="listbox-multi-root" maxW="80r">
        <Div width="60r" mb="4r">
          <Listbox
            data-testid="test-listbox-multi"
            selection="multiple"
            value={value}
            onChange={setValue}
          >
            <Listbox.Option value="email" data-testid="opt-m-email">
              Email notifications
            </Listbox.Option>
            <Listbox.Option value="sms" data-testid="opt-m-sms">
              SMS alerts
            </Listbox.Option>
            <Listbox.Option value="push" data-testid="opt-m-push">
              Push notifications
            </Listbox.Option>
          </Listbox>
        </Div>

        <Span data-testid="listbox-multi-value-display" fontSize="3.5r" color="design.text.base">
          Selected: {value.length ? value.join(', ') : 'None'}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const Sections = () => {
  const [value, setValue] = React.useState<string | null>('react')

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="listbox-sections-root" maxW="80r">
        <Div width="60r">
          <Listbox value={value} onChange={setValue}>
            <Listbox.Section title="Frontend">
              <Listbox.Option value="react" data-testid="opt-s-react">
                React
              </Listbox.Option>
              <Listbox.Option value="vue" data-testid="opt-s-vue">
                Vue
              </Listbox.Option>
            </Listbox.Section>
            <Listbox.Section title="Backend">
              <Listbox.Option value="node" data-testid="opt-s-node">
                Node.js
              </Listbox.Option>
              <Listbox.Option value="go" data-testid="opt-s-go">
                Go
              </Listbox.Option>
            </Listbox.Section>
          </Listbox>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}
