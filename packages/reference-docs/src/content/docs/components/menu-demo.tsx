import { useState } from 'react'
import { Div, Span } from '@reference-ui/react'
import { Menu, Popover, useMenuTriggerKeys } from '@reference-ui/lib'
import { demoNote } from './demo-surface'

/** The menu button: Popover.Trigger wired to the menu's keyboard entry. */
function ActionsTrigger() {
  const keys = useMenuTriggerKeys()
  return (
    <Popover.Trigger aria-haspopup="menu" onKeyDown={keys.onKeyDown} onClick={keys.onClick}>
      Actions
    </Popover.Trigger>
  )
}

/** A dropdown menu with commands, a toggle, and a submenu. */
export function MenuDemo() {
  const [last, setLast] = useState('nothing yet')
  const [grid, setGrid] = useState(true)
  const [shareOpen, setShareOpen] = useState(false)
  return (
    <Div display="flex" flexDirection="column" alignItems="center" gap="3r">
      <Popover>
        <ActionsTrigger />
        <Popover.Content placement="bottom-start">
          <Menu aria-label="Actions">
            <Menu.Item onSelect={() => setLast('Cut')}>Cut</Menu.Item>
            <Menu.Item onSelect={() => setLast('Copy')}>Copy</Menu.Item>
            <Menu.Item disabled>Paste</Menu.Item>
            <Menu.Separator />
            <Menu.CheckboxItem checked={grid} onChange={setGrid}>
              Show grid
            </Menu.CheckboxItem>
            <Menu
              open={shareOpen}
              onOpen={() => setShareOpen(true)}
              onDismiss={() => setShareOpen(false)}
            >
              <Menu.Trigger>Share</Menu.Trigger>
              <Menu.Content>
                <Menu.Item onSelect={() => setLast('Email')}>Email</Menu.Item>
                <Menu.Item onSelect={() => setLast('Copy link')}>Copy link</Menu.Item>
              </Menu.Content>
            </Menu>
          </Menu>
        </Popover.Content>
      </Popover>
      <Span className={demoNote}>
        Last action: {last}. Grid: {grid ? 'on' : 'off'}.
      </Span>
    </Div>
  )
}
