import { useState } from 'react'
import { Div, Span } from '@reference-ui/react'
import { Listbox } from '@reference-ui/lib'
import { demoNote, listSurface } from './demo-surface'

/** A single-selection listbox with one disabled option. */
export function ListboxDemo() {
  const [value, setValue] = useState<string | null>('react')
  return (
    <Div display="flex" flexDirection="column" gap="3r">
      <Listbox
        aria-label="Framework"
        value={value}
        onChange={setValue}
        className={listSurface}
      >
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
