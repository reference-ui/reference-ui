/**
 * Menubar.Menu: the identity scope binding one trigger to one popover.
 * Takes an optional value (else a stable generated id), opens exactly
 * when the bar value names it, and closes the siblings by construction.
 * Warns and renders nothing outside a Menubar root.
 */
import * as React from 'react'
import { Popover } from '../../Popover'
import { MenubarContext, MenubarMenuContext, type MenubarMenuContextValue } from '../context'
import type { MenubarMenuProps } from '../types'
import { devWarn } from '../shared/warn'

export function MenubarMenu({ value: valueProp, children }: MenubarMenuProps) {
  const menubar = React.useContext(MenubarContext)
  const generatedId = React.useId()
  const stableIdRef = React.useRef<string | null>(null)
  if (stableIdRef.current === null) {
    stableIdRef.current = `menubar-menu-${String(generatedId).replace(/[^a-zA-Z0-9_-]/g, '')}`
  }
  const menuValue = valueProp ?? stableIdRef.current
  const menuContextValue = React.useMemo<MenubarMenuContextValue>(
    () => ({ menuValue }),
    [menuValue]
  )
  if (!menubar) {
    devWarn('Menubar.Menu must be used inside a Menubar root.')
    return null
  }
  // Single value, single open: this Popover is open exactly when the bar's
  // value names it. Opening one closes the others by construction.
  const isOpen = menubar.value === menuValue
  const handleOpenChange = (next: boolean) => {
    if (next) {
      menubar.requestValue(menuValue)
    } else if (menubar.value === menuValue) {
      menubar.requestValue(null)
    }
  }
  return (
    <MenubarMenuContext.Provider value={menuContextValue}>
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        {children}
      </Popover>
    </MenubarMenuContext.Provider>
  )
}
