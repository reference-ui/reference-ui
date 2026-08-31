import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { Combobox } from './index'
import { Field } from '../Field'

export default {
  Searchable: () => {
    const [selected, setSelected] = React.useState<string | null>('react')
    return (
      <Div maxW="80r" display="flex" flexDirection="column" gap="3r">
        <Combobox value={selected} onChange={setSelected}>
          <Field>
            <Combobox.Input placeholder="Select framework..." border="none" outline="none" bg="transparent" />
            <Combobox.Trigger>▾</Combobox.Trigger>
          </Field>
          <Combobox.Popover>
            <Combobox.Option value="react">React</Combobox.Option>
            <Combobox.Option value="vue">Vue</Combobox.Option>
            <Combobox.Option value="angular">Angular</Combobox.Option>
            <Combobox.Option value="svelte">Svelte</Combobox.Option>
            <Combobox.Option value="solid">Solid</Combobox.Option>
          </Combobox.Popover>
        </Combobox>
        <Span fontSize="3r" color="design.text.light">Selected framework: {selected ?? 'None'}</Span>
      </Div>
    )
  },
}
