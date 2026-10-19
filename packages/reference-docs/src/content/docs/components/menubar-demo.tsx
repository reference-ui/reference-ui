// Live Menubar demo for the Menubar component page.
// It takes nothing and emits the menu bar. Colocated with the page that embeds it.
import { useState } from 'react'
import { Div, Span } from '@reference-ui/react'
import { Menu, Menubar } from '@reference-ui/lib'
import { demoNote } from './demo-surface'

/** A three-menu bar; one value names the open menu. */
export function MenubarDemo() {
  const [open, setOpen] = useState<string | null>(null)
  const [last, setLast] = useState('nothing yet')
  const [wrap, setWrap] = useState(false)
  return (
    <Div display="flex" flexDirection="column" alignItems="center" gap="3r">
      <Menubar aria-label="Editor" value={open} onChange={setOpen}>
        <Menubar.Menu value="file">
          <Menubar.Trigger>File</Menubar.Trigger>
          <Menubar.Content>
            <Menu.Item onSelect={() => setLast('New')}>New</Menu.Item>
            <Menu.Item onSelect={() => setLast('Open')}>Open</Menu.Item>
          </Menubar.Content>
        </Menubar.Menu>
        <Menubar.Menu value="edit">
          <Menubar.Trigger>Edit</Menubar.Trigger>
          <Menubar.Content>
            <Menu.Item onSelect={() => setLast('Undo')}>Undo</Menu.Item>
            <Menu.Item onSelect={() => setLast('Redo')}>Redo</Menu.Item>
          </Menubar.Content>
        </Menubar.Menu>
        <Menubar.Menu value="view">
          <Menubar.Trigger>View</Menubar.Trigger>
          <Menubar.Content>
            <Menu.CheckboxItem checked={wrap} onChange={setWrap}>
              Word wrap
            </Menu.CheckboxItem>
          </Menubar.Content>
        </Menubar.Menu>
      </Menubar>
      <Span className={demoNote}>Last action: {last}</Span>
    </Div>
  )
}
