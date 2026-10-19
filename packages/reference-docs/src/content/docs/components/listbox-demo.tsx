import { useState } from 'react'
import { Div, Span } from '@reference-ui/react'
import { Listbox } from '@reference-ui/lib'
import { demoNote } from './demo-surface'

/** A single-selection listbox with one disabled option. */
export function ListboxDemo() {
  const [value, setValue] = useState<string | null>('react')
  return (
    <Div display="flex" flexDirection="column" gap="3r">
      <Listbox aria-label="Framework" value={value} onChange={setValue} minWidth="60r">
        <Listbox.Option value="react">React</Listbox.Option>
        <Listbox.Option value="vue">Vue</Listbox.Option>
        <Listbox.Option value="svelte">Svelte</Listbox.Option>
        <Listbox.Option value="angular" disabled>
          Angular
        </Listbox.Option>
      </Listbox>
      <Span className={demoNote}>Selected: {value ?? 'none'}</Span>
    </Div>
  )
}

/** A multiple-selection listbox grouped into sections. */
export function ListboxMultipleDemo() {
  const [value, setValue] = useState<string[]>(['apple'])
  return (
    <Div display="flex" flexDirection="column" gap="3r">
      <Listbox
        aria-label="Produce"
        selection="multiple"
        value={value}
        onChange={setValue}
        minWidth="60r"
      >
        <Listbox.Section title="Fruit">
          <Listbox.Option value="apple">Apple</Listbox.Option>
          <Listbox.Option value="banana">Banana</Listbox.Option>
        </Listbox.Section>
        <Listbox.Section title="Vegetables">
          <Listbox.Option value="carrot">Carrot</Listbox.Option>
          <Listbox.Option value="leek">Leek</Listbox.Option>
        </Listbox.Section>
      </Listbox>
      <Span className={demoNote}>Selected: {value.length > 0 ? value.join(', ') : 'none'}</Span>
    </Div>
  )
}
