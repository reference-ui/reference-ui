/**
 * Menubar.Content: the popover panel hosting one bar menu. Takes Popover
 * content props, renders a Menu inside, and owns root-level Left/Right:
 * nested submenu keys belong to Menu, but a root-level arrow switches
 * the bar value so motion glides across menus without closing the bar.
 */
import * as React from 'react'
import { Popover } from '../../Popover'
import { Menu } from '../../Menu'
import { getDirection } from '../../RovingFocus'
import { menubarArrowDirection } from '../nav/menubar-nav'
import { MenubarContext, MenubarMenuContext } from '../context'
import type { MenubarContentProps } from '../types'
import { devWarn } from '../shared/warn'

export const MenubarContent = React.forwardRef<HTMLDivElement, MenubarContentProps>(
  function MenubarContent({ children, onKeyDown, ...props }: MenubarContentProps, ref) {
    const menubar = React.useContext(MenubarContext)
    const menu = React.useContext(MenubarMenuContext)
    if (!menubar || !menu) {
      devWarn('Menubar.Content must be used inside a Menubar.Menu within a Menubar root.')
      return null
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(e)
      if (e.defaultPrevented) return
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      const host = e.currentTarget
      const target = e.target as HTMLElement | null
      if (!target || typeof target.closest !== 'function') return
      // Root level only: nested submenu contents portal out, so a closest()
      // mismatch means Menu owns this key (submenu open/close, one level).
      const rootMenu = host.querySelector('[data-reference-menu-content]')
      const level = target.closest('[data-reference-menu-content]')
      if (!rootMenu || level !== rootMenu) return
      // A submenu parent's open-direction arrow opens it (Menu-owned): yield
      // exactly when Menu acts, reading direction from the item itself the
      // way MenuTrigger does. The switch below reads the bar root instead —
      // this host is portaled to body and would miss an ancestral `dir`.
      const item = target.closest(
        '[role="menuitem"],[role="menuitemcheckbox"],[role="menuitemradio"]'
      )
      if (item?.getAttribute('aria-haspopup') === 'menu') {
        const menuOpenKey = getDirection(item as HTMLElement) === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
        if (e.key === menuOpenKey) return
      }
      const isRtl = getDirection(menubar.getRootNode()) === 'rtl'
      const direction = menubarArrowDirection(e.key, isRtl)
      if (direction === null) return
      e.preventDefault()
      menubar.requestAdjacent(menu.menuValue, direction)
    }

    // ref rides a spread object (see MenubarTrigger): plain passthrough to
    // the Popover host on React 19.
    const contentProps = { ...props, ref }

    return (
      <Popover.Content onKeyDown={handleKeyDown} {...contentProps}>
        <Menu>{children}</Menu>
      </Popover.Content>
    )
  }
)
