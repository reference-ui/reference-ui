// Live Combobox demos for the Combobox component page.
// They take nothing and emit the editable combo plus the select-style variant. Colocated
// with the page that embeds them.
import { useState } from 'react'
import { Div, Span, css } from '@reference-ui/react'
import { Combobox, Field, Listbox } from '@reference-ui/lib'
import { demoNote, demoStack } from './demo-surface'

const fullWidth = css({ width: '100%' })

const frameworks = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'solid', label: 'Solid' },
]

function labelOf(value: string | null) {
  return frameworks.find(item => item.value === value)?.label ?? ''
}

/** A searchable framework picker; the demo owns filtering. */
export function ComboboxDemo() {
  const [value, setValue] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const visible = frameworks.filter(item =>
    item.label.toLowerCase().includes(query.toLowerCase())
  )
  return (
    <Div className={demoStack}>
      <Combobox
        value={value}
        onChange={next => {
          setValue(next)
          setQuery(labelOf(next))
        }}
        inputValue={query}
        onInputValueChange={setQuery}
      >
        <Field className={fullWidth}>
          <Combobox.Input aria-label="Framework" placeholder="Search frameworks" />
        </Field>
        <Combobox.Popover>
          <Listbox>
            {visible.length > 0 ? (
              visible.map(item => (
                <Listbox.Option key={item.value} value={item.value}>
                  {item.label}
                </Listbox.Option>
              ))
            ) : (
              <Listbox.Empty>No frameworks found</Listbox.Empty>
            )}
          </Listbox>
        </Combobox.Popover>
      </Combobox>
      <Span className={demoNote}>Selected: {value ?? 'none'}</Span>
    </Div>
  )
}

/** A select-only combobox: a button opens the list, there is no text input. */
export function ComboboxSelectDemo() {
  const [value, setValue] = useState<string | null>('react')
  return (
    <Div className={demoStack}>
      <Combobox value={value} onChange={setValue}>
        <Combobox.Trigger aria-label="Framework" className={fullWidth}>
          {labelOf(value) || 'Select a framework'}
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
      <Span className={demoNote}>Selected: {value ?? 'none'}</Span>
    </Div>
  )
}
