import { useState } from 'react'
import { Div, Span } from '@reference-ui/react'
import { Menu, Popover, useMenuTriggerKeys } from '@reference-ui/lib'
import { demoNote, floatingSurface } from './demo-surface'

/** The menu button: Popover.Trigger wired to the menu's keyboard entry. */
function ActionsTrigger() {
  const keys = useMenuTriggerKeys()
  return (
    <Popover.Trigger aria-haspopup="menu" onKeyDown={keys.onKeyDown} onClick={keys.onClick}>
      Actions
    </Popover.Trigger>
  )
}

/** A dropdown menu: Popover owns open state, Menu owns the items. */
export function MenuDemo() {
  const [last, setLast] = useState('nothing yet')
  return (
    <Div display="flex" flexDirection="column" alignItems="center" gap="3r">
      <Popover>
        <ActionsTrigger />
        <Popover.Content placement="bottom-start" className={floatingSurface}>
          <Menu aria-label="Actions">
            <Menu.Item onSelect={() => setLast('Cut')}>Cut</Menu.Item>
            <Menu.Item onSelect={() => setLast('Copy')}>Copy</Menu.Item>
            <Menu.Item onSelect={() => setLast('Paste')}>Paste</Menu.Item>
            <Menu.Separator />
            <Menu.Item disabled>Delete</Menu.Item>
          </Menu>
        </Popover.Content>
      </Popover>
      <Span className={demoNote}>Last action: {last}</Span>
    </Div>
  )
}
