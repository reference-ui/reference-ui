import * as React from 'react'
import { Div, type PrimitiveProps } from '@reference-ui/react'
import { Popover, type PopoverContentProps, type PopoverTriggerProps } from '../Popover'
import { Menu, useMenuTriggerKeys } from '../Menu'
import { RovingFocus, getDirection } from '../RovingFocus'
import { adjacentMenubarValue, menubarArrowDirection } from './menubar-nav'

export type MenubarValue = string | null

export type MenubarProps = PrimitiveProps<'div'> & {
  /** Open menu. `null` means none open. Required: Menubar is controlled-only. */
  value: MenubarValue
  /** Fires on user-driven open-menu changes. Never redundant. Required. */
  onValueChange: (value: MenubarValue) => void
  /** Wrap trigger arrows and menu switching at the edges. Default false. */
  loop?: boolean
}

export type MenubarMenuProps = {
  /** Identity within the bar. Defaults to a stable generated id. */
  value?: string
  children?: React.ReactNode
}

export type MenubarTriggerProps = PopoverTriggerProps

export type MenubarContentProps = PopoverContentProps

function devWarn(message: string) {
  if (process.env.NODE_ENV !== 'production') {
    console.error(`Reference UI: ${message}`)
  }
}

interface MenubarTriggerRegistration {
  menuValue: string
  disabled: boolean
  getNode: () => HTMLElement | null
}

interface MenubarContextValue {
  value: MenubarValue
  requestValue: (next: MenubarValue) => void
  requestAdjacent: (fromValue: string, direction: 1 | -1) => void
  registerTrigger: (reg: MenubarTriggerRegistration) => () => void
  /** Live menubar root node. Direction reads run against it: contents portal
   * to body and would miss an ancestral `dir`. */
  getRootNode: () => HTMLDivElement | null
}

const MenubarContext = React.createContext<MenubarContextValue | null>(null)

interface MenubarMenuContextValue {
  menuValue: string
}

const MenubarMenuContext = React.createContext<MenubarMenuContextValue | null>(null)

const MenubarRoot = React.forwardRef<HTMLDivElement, MenubarProps>(function MenubarRoot(
  { children, value, onValueChange, loop = false, ...props }: MenubarProps,
  ref
) {
  const valueRef = React.useRef(value)
  valueRef.current = value
  const onValueChangeRef = React.useRef(onValueChange)
  onValueChangeRef.current = onValueChange
  const loopRef = React.useRef(loop)
  loopRef.current = loop

  const requestValue = React.useCallback((next: MenubarValue) => {
    if (next === valueRef.current) return
    onValueChangeRef.current(next)
  }, [])

  const requestValueRef = React.useRef(requestValue)
  requestValueRef.current = requestValue

  const registryRef = React.useRef(new Map<string, MenubarTriggerRegistration>())

  const registerTrigger = React.useCallback((reg: MenubarTriggerRegistration) => {
    const registry = registryRef.current
    if (registry.has(reg.menuValue)) {
      devWarn(
        `Menubar: duplicate menu value "${reg.menuValue}". Menu values must be unique; only one menu can be open.`
      )
    }
    registry.set(reg.menuValue, reg)
    return () => {
      if (registry.get(reg.menuValue) === reg) registry.delete(reg.menuValue)
    }
  }, [])

  // DOM-ordered enabled values. Triggers register by menu value; order reads
  // live node positions (RovingFocus getOrderedItems precedent) so authored
  // order never disagrees with the row on screen.
  const orderedEnabledValues = React.useCallback((): string[] => {
    const entries = [...registryRef.current.values()].filter(reg => {
      if (reg.disabled) return false
      const node = reg.getNode()
      return node !== null && node.isConnected
    })
    entries.sort((a, b) => {
      const elA = a.getNode()
      const elB = b.getNode()
      if (!elA || !elB) return 0
      const pos = elA.compareDocumentPosition(elB)
      if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1
      if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1
      return 0
    })
    return entries.map(reg => reg.menuValue)
  }, [])

  const requestAdjacent = React.useCallback(
    (fromValue: string, direction: 1 | -1) => {
      const next = adjacentMenubarValue(
        orderedEnabledValues(),
        fromValue,
        direction,
        loopRef.current
      )
      if (next !== null && next !== fromValue) requestValueRef.current(next)
    },
    [orderedEnabledValues]
  )

  const rootNodeRef = React.useRef<HTMLDivElement | null>(null)
  const composedRootRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      rootNodeRef.current = node
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref && typeof ref === 'object' && 'current' in ref) {
        ;(ref as React.MutableRefObject<HTMLDivElement | null>).current = node
      }
    },
    [ref]
  )
  const getRootNode = React.useCallback(() => rootNodeRef.current, [])

  const contextValue = React.useMemo<MenubarContextValue>(
    () => ({ value, requestValue, requestAdjacent, registerTrigger, getRootNode }),
    [value, requestValue, requestAdjacent, registerTrigger, getRootNode]
  )

  return (
    <MenubarContext.Provider value={contextValue}>
      <RovingFocus.Root orientation="horizontal" loop={loop}>
        <Div
          role="menubar"
          display="flex"
          alignItems="center"
          gap="1r"
          {...props}
          ref={composedRootRef}
        >
          {children}
        </Div>
      </RovingFocus.Root>
    </MenubarContext.Provider>
  )
})

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

export const MenubarTrigger = React.forwardRef<HTMLButtonElement, MenubarTriggerProps>(
  function MenubarTrigger(
    {
      children,
      disabled = false,
      onKeyDown,
      onClick,
      variant = 'ghost',
      'aria-haspopup': ariaHasPopup = 'menu',
      id: authoredId,
      className,
      style,
      ...props
    }: MenubarTriggerProps,
    ref
  ) {
    const menubar = React.useContext(MenubarContext)
    const menu = React.useContext(MenubarMenuContext)
    const keys = useMenuTriggerKeys()

    const nodeRef = React.useRef<HTMLButtonElement | null>(null)
    const composedTriggerRef = React.useCallback(
      (node: HTMLButtonElement | null) => {
        nodeRef.current = node
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref && typeof ref === 'object' && 'current' in ref) {
          ;(ref as React.MutableRefObject<HTMLButtonElement | null>).current = node
        }
      },
      [ref]
    )

    const menuValue = menu?.menuValue
    React.useEffect(() => {
      if (!menubar || menuValue === undefined) return
      return menubar.registerTrigger({
        menuValue,
        disabled,
        getNode: () => nodeRef.current,
      })
    }, [menubar, menuValue, disabled])

    if (!menubar || !menu) {
      devWarn('Menubar.Trigger must be used inside a Menubar.Menu within a Menubar root.')
      return null
    }
    const isOpen = menubar.value === menu.menuValue

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      onKeyDown?.(e)
      if (e.defaultPrevented) return
      // Menu entry: Down/Up/Enter/Space open with first/last-item focus.
      keys.onKeyDown(e)
      if (e.defaultPrevented) return
      // Cross-trigger move: RovingFocus (chained after us) moves focus; when
      // a menu is open the newly focused trigger's menu opens too. Closed
      // bars move focus only. Never preventDefault: the roving move owns it.
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        if (menubar.value === null) return
        const direction = menubarArrowDirection(
          e.key,
          getDirection(menubar.getRootNode()) === 'rtl'
        )
        if (direction === null) return
        menubar.requestAdjacent(menu.menuValue, direction)
      }
    }

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e)
      // Pointer opening focuses the menu itself, never an item.
      keys.onClick(e)
    }

    // ref rides a spread object (EntryTrigger precedent): Popover.Trigger is
    // a plain function, so a literal ref attribute fails excess checking
    // while the runtime forwards it to the host on React 19.
    const triggerProps = { ...props, ref: composedTriggerRef as React.Ref<HTMLButtonElement> }

    return (
      <RovingFocus.Item disabled={disabled}>
        <Popover.Trigger
          role="menuitem"
          aria-haspopup={ariaHasPopup}
          data-state={isOpen ? 'open' : 'closed'}
          disabled={disabled}
          variant={variant}
          onKeyDown={handleKeyDown}
          onClick={handleClick}
          className={className}
          style={style}
          {...triggerProps}
          id={authoredId}
        >
          {children}
        </Popover.Trigger>
      </RovingFocus.Item>
    )
  }
)

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

export const Menubar = MenubarRoot as React.ForwardRefExoticComponent<
  MenubarProps & React.RefAttributes<HTMLDivElement>
> & {
  Menu: typeof MenubarMenu
  Trigger: typeof MenubarTrigger
  Content: typeof MenubarContent
}

Menubar.Menu = MenubarMenu
Menubar.Trigger = MenubarTrigger
Menubar.Content = MenubarContent
