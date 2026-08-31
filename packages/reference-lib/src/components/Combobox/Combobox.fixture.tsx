import * as React from 'react'
import { Button, Div, Span } from '@reference-ui/react'
import { ArrowDropDownIcon } from '@reference-ui/icons'
import { Combobox } from './index'
import { Field } from '../Field'
import { Listbox } from '../Listbox'

const frameworks = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'angular', label: 'Angular' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'solid', label: 'Solid' },
]

function selectedLabel(value: string | null) {
  return frameworks.find(item => item.value === value)?.label ?? 'Select framework'
}

export default {
  Searchable: () => {
    const [selected, setSelected] = React.useState<string | null>('react')
    const [query, setQuery] = React.useState('React')
    const selectedItem = frameworks.find(item => item.value === selected)
    const searching = query !== (selectedItem?.label ?? '')
    const visible = searching
      ? frameworks.filter(item => item.label.toLowerCase().includes(query.toLowerCase()))
      : frameworks

    return (
      <Div maxW="80r" display="flex" flexDirection="column" gap="3r">
        <Combobox
          value={selected}
          onChange={value => {
            setSelected(value)
            setQuery(frameworks.find(item => item.value === value)?.label ?? '')
          }}
          inputValue={query}
          onInputValueChange={setQuery}
        >
          <Field width="100%">
            <Combobox.Input placeholder="Select framework..." />
            <Button
              type="button"
              aria-label="Open suggestions"
              onClick={event => {
                const field = event.currentTarget.closest('[data-reference-field]')
                field?.querySelector('input')?.focus()
              }}
            >
              <ArrowDropDownIcon />
            </Button>
          </Field>
          <Combobox.Popover>
            <Listbox>
              {visible.length ? (
                visible.map(item => (
                  <Listbox.Option key={item.value} value={item.value}>
                    {item.label}
                  </Listbox.Option>
                ))
              ) : (
                <Span px="3r" py="2r" color="design.text.light" fontSize="3.5r">
                  No matches
                </Span>
              )}
            </Listbox>
          </Combobox.Popover>
        </Combobox>
        <Span fontSize="3r" color="design.text.light">
          Selected framework: {selected ?? 'None'}
        </Span>
      </Div>
    )
  },
  SelectOnly: () => {
    const [selected, setSelected] = React.useState<string | null>('react')
    return (
      <Div maxW="80r" display="flex" flexDirection="column" gap="3r">
        <Combobox value={selected} onChange={setSelected}>
          <Combobox.Trigger width="100%" justifyContent="space-between">
            {selectedLabel(selected)}
            <ArrowDropDownIcon />
          </Combobox.Trigger>
          <Combobox.Popover>
            <Listbox>
              {frameworks.map(item => (
                <Listbox.Option key={item.value} value={item.value}>
                  {item.label}
                </Listbox.Option>
              ))}
            </Listbox>
          </Combobox.Popover>
        </Combobox>
        <Span fontSize="3r" color="design.text.light">
          Selected framework: {selected ?? 'None'}
        </Span>
      </Div>
    )
  },
}
