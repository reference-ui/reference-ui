import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { Listbox } from './index'

export default {
  SingleSelection: () => {
    const [value, setValue] = React.useState<string | null>('react')
    return (
      <Div maxW="60r" display="flex" flexDirection="column" gap="3r">
        <Listbox value={value} onChange={setValue}>
          <Listbox.Option value="react">React</Listbox.Option>
          <Listbox.Option value="vue">Vue</Listbox.Option>
          <Listbox.Option value="svelte">Svelte</Listbox.Option>
          <Listbox.Option value="solid">Solid</Listbox.Option>
        </Listbox>
        <Span fontSize="3r" color="design.text.light">Selected: {value ?? 'None'}</Span>
      </Div>
    )
  },
  MultipleSelection: () => {
    const [value, setValue] = React.useState<string[]>(['email'])
    return (
      <Div maxW="60r" display="flex" flexDirection="column" gap="3r">
        <Listbox selection="multiple" value={value} onChange={setValue}>
          <Listbox.Option value="email">Email notifications</Listbox.Option>
          <Listbox.Option value="sms">SMS alerts</Listbox.Option>
          <Listbox.Option value="push">Push notifications</Listbox.Option>
          <Listbox.Option value="digest" disabled>
            Weekly digest (disabled)
          </Listbox.Option>
        </Listbox>
        <Span fontSize="3r" color="design.text.light">
          Selected: {value.length ? value.join(', ') : 'None'}
        </Span>
      </Div>
    )
  },
}
