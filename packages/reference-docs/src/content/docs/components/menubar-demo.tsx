import { useState } from 'react'
import { Menu, Menubar } from '@reference-ui/lib'
import { floatingSurface } from './demo-surface'

/** A two-menu bar; one value names the open menu. */
export function MenubarDemo() {
  const [open, setOpen] = useState<string | null>(null)
  return (
    <Menubar aria-label="Editor" value={open} onChange={setOpen}>
      <Menubar.Menu value="file">
        <Menubar.Trigger>File</Menubar.Trigger>
        <Menubar.Content aria-label="File" className={floatingSurface}>
          <Menu.Item>New</Menu.Item>
          <Menu.Item>Open</Menu.Item>
        </Menubar.Content>
      </Menubar.Menu>
      <Menubar.Menu value="edit">
        <Menubar.Trigger>Edit</Menubar.Trigger>
        <Menubar.Content aria-label="Edit" className={floatingSurface}>
          <Menu.Item>Undo</Menu.Item>
          <Menu.Item>Redo</Menu.Item>
        </Menubar.Content>
      </Menubar.Menu>
    </Menubar>
  )
}
