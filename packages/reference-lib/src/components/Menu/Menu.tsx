import * as React from 'react'
import { Div, type PrimitiveProps } from '@reference-ui/react'
import { useOverlay } from '../Overlay'
import { RovingFocus } from '../RovingFocus'
import { controlSize, controlHeightPx } from '../../core/theme/primitives/shared'

export type MenuProps = PrimitiveProps<'div'>

export type MenuEntryStrategy = 'first' | 'last' | null

// Pending trigger-key entry intent. The trigger lives outside the mounted
// Menu (it stays mounted while the Popover is closed), so the opening key is
// recorded here by useMenuTriggerKeys and consumed once per open by Menu.
let pendingMenuEntry: MenuEntryStrategy = null

function setMenuEntryIntent(strategy: MenuEntryStrategy) {
  pendingMenuEntry = strategy
}

function consumeMenuEntryIntent(): MenuEntryStrategy {
  const strategy = pendingMenuEntry
  pendingMenuEntry = null
  return strategy
}

// Keyboard-entry wiring for a Popover.Trigger that opens a root Menu.
// Spread the result onto the trigger; chain consumer handlers first so a
// consumer preventDefault still wins.
export function useMenuTriggerKeys() {
  const overlay = useOverlay()

  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.defaultPrevented || !overlay) return
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setMenuEntryIntent('first')
        overlay.setIsOpen(true)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setMenuEntryIntent('last')
        overlay.setIsOpen(true)
      }
    },
    [overlay]
  )

  const onClick = React.useCallback((_e: React.MouseEvent<HTMLButtonElement>) => {
    // Pointer opening focuses the menu itself, never an item. Keyboard
    // Enter/Space never reach here: the keydown above prevents activation.
    setMenuEntryIntent(null)
  }, [])

  return React.useMemo(() => ({ onKeyDown, onClick }), [onKeyDown, onClick])
}

function restoreFocusToTrigger(
  trigger: HTMLElement | null | undefined,
  fallback: HTMLElement | null | undefined = null
) {
  if (
    trigger &&
    trigger.isConnected &&
    !trigger.hasAttribute('disabled') &&
    trigger.getAttribute('aria-disabled') !== 'true'
  ) {
    trigger.focus()
    return
  }
  if (fallback && fallback.isConnected) {
    fallback.focus()
  }
}

function findNextTabbable(from: HTMLElement, reverse = false): HTMLElement | null {
  const allTabbables = Array.from(
    document.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter(el => el.offsetParent !== null || el.offsetWidth > 0)

  const index = allTabbables.indexOf(from)
  if (index === -1) return null
  return reverse ? (allTabbables[index - 1] ?? null) : (allTabbables[index + 1] ?? null)
}

const UNCONSUMED: unique symbol = Symbol('unconsumed')

// First-seen menu id per Overlay root. Overlay (and its triggerRef object)
// outlives Menu across Presence remounts; on real useId the derived value is
// identical at every sighting, and on the React 17 shim (fresh id per
// render) the memo holds the first one. One root Menu per Popover.
const menuIdByTriggerRef = new WeakMap<object, string>()

export const Menu = React.forwardRef<HTMLDivElement, MenuProps>(function Menu(
  { children, className, style, onKeyDown, id: authoredId, ...props }: MenuProps,
  ref
) {
  const overlay = useOverlay()
  const isOpen = overlay?.isOpen ?? false
  const menuRef = React.useRef<HTMLDivElement | null>(null)
  const generatedId = React.useId()
  // The React 17 CT shim returns a fresh id every render; capture the first
  // one. Real useId (18/19) is already stable, so this is a no-op there.
  const stableIdRef = React.useRef<string | null>(null)
  if (stableIdRef.current === null) {
    stableIdRef.current = generatedId
  }
  // Derive from the Overlay layer id: Menu unmounts on close, so its own
  // useId would refresh every reopen. The triggerRef-keyed memo holds the
  // first sighting across remounts (matters on the React 17 shim, where
  // useId is fresh every render). No-overlay Menus (always mounted) fall
  // back to the local id.
  const overlayId = overlay?.id ? String(overlay.id).replace(/[^a-zA-Z0-9_-]/g, '') : ''
  const triggerKey: object | null = overlay?.triggerRef ?? null
  let generatedMenuId: string
  if (triggerKey) {
    let memo = menuIdByTriggerRef.get(triggerKey)
    if (!memo) {
      memo = overlayId ? `${overlayId}-menu` : stableIdRef.current
      menuIdByTriggerRef.set(triggerKey, memo)
    }
    generatedMenuId = memo
  } else {
    generatedMenuId = stableIdRef.current
  }
  const menuId = authoredId ?? generatedMenuId

  const composedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      menuRef.current = node
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref && typeof ref === 'object' && 'current' in ref) {
        ;(ref as React.MutableRefObject<HTMLDivElement | null>).current = node
      }
    },
    [ref]
  )

  // Trigger-key entry focus, consumed once per open. The ref (not the module
  // cell) survives StrictMode effect replay; closing resets for the next open.
  const consumedRef = React.useRef<MenuEntryStrategy | typeof UNCONSUMED>(UNCONSUMED)
  React.useEffect(() => {
    if (!isOpen) {
      consumedRef.current = UNCONSUMED
      return
    }
    if (consumedRef.current === UNCONSUMED) {
      consumedRef.current = consumeMenuEntryIntent()
    }
    const strategy = consumedRef.current

    const frameId = requestAnimationFrame(() => {
      if (!menuRef.current) return

      if (strategy === null) {
        menuRef.current.focus({ preventScroll: true })
        return
      }

      const items = Array.from(
        menuRef.current.querySelectorAll<HTMLElement>(
          '[role="menuitem"]:not([aria-disabled="true"]):not([data-disabled])'
        )
      )
      if (items.length === 0) return

      const target = strategy === 'last' ? items[items.length - 1] : items[0]
      target?.focus()
    })

    return () => cancelAnimationFrame(frameId)
  }, [isOpen])

  const wasOpenRef = React.useRef(isOpen)
  React.useEffect(() => {
    const wasOpen = wasOpenRef.current
    wasOpenRef.current = isOpen
    if (!wasOpen || isOpen) return
    if (menuRef.current?.contains(document.activeElement)) {
      restoreFocusToTrigger(overlay?.triggerRef.current as HTMLElement | null)
    }
  })

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || !overlay) return

    if (e.key === 'Tab') {
      e.preventDefault()
      overlay.setIsOpen(false)
      const trigger = overlay.triggerRef.current as HTMLElement | null
      const next = trigger ? findNextTabbable(trigger, e.shiftKey) : null
      if (next) {
        next.focus()
      } else {
        restoreFocusToTrigger(trigger)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      overlay.setIsOpen(false)
      restoreFocusToTrigger(overlay.triggerRef.current as HTMLElement | null)
    }
  }

  return (
    <Div
      role="menu"
      id={menuId}
      data-reference-menu-content=""
      tabIndex={-1}
      minW="40r"
      bg="ui.dialog.background"
      color="ui.dialog.foreground"
      borderRadius="md"
      p="1r"
      boxShadow="0 4px 16px rgba(0,0,0,0.12)"
      border="1px solid"
      borderColor="ui.dialog.border"
      outline="none"
      className={className}
      style={style}
      onKeyDown={handleKeyDown}
      {...props}
      ref={composedRef}
    >
      <RovingFocus.Root orientation="vertical" loop typeahead>
        <Div display="flex" flexDirection="column" gap="0.5r" outline="none">
          {children}
        </Div>
      </RovingFocus.Root>
    </Div>
  )
}) as React.ForwardRefExoticComponent<MenuProps & React.RefAttributes<HTMLDivElement>> & {
  Item: typeof MenuItem
  Separator: typeof MenuSeparator
}

export type MenuItemProps = Omit<PrimitiveProps<'div'>, 'onSelect'> & {
  disabled?: boolean
  selected?: boolean
  textValue?: string
  onSelect?: (event: Event) => void
  closeOnClick?: boolean
  /** @deprecated Use closeOnClick instead */
  closeOnSelect?: boolean
}

export const MenuItem = React.forwardRef<HTMLDivElement, MenuItemProps>(function MenuItem(
  {
    children,
    disabled = false,
    selected = false,
    textValue,
    onSelect,
    closeOnClick = true,
    closeOnSelect,
    onClick,
    onKeyDown,
    className,
    style,
    ...props
  }: MenuItemProps,
  ref
) {
  const overlay = useOverlay()
  const shouldClose = closeOnSelect !== undefined ? closeOnSelect : closeOnClick

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) {
      e.preventDefault()
      return
    }
    onClick?.(e)
    if (e.defaultPrevented) return
    onSelect?.(e.nativeEvent)
    if (e.nativeEvent.defaultPrevented) return
    if (shouldClose && overlay) {
      overlay.setIsOpen(false)
      restoreFocusToTrigger(overlay.triggerRef.current as HTMLElement | null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || disabled) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.stopPropagation()
      onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>)
      if (e.defaultPrevented) return
      onSelect?.(e.nativeEvent)
      if (e.nativeEvent.defaultPrevented) {
        e.preventDefault()
        return
      }
      e.preventDefault()
      if (shouldClose && overlay) {
        overlay.setIsOpen(false)
        restoreFocusToTrigger(overlay.triggerRef.current as HTMLElement | null)
      }
    }
  }

  return (
    <RovingFocus.Item disabled={disabled} textValue={textValue}>
      <Div
        role="menuitem"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled ? 'true' : undefined}
        data-disabled={disabled ? '' : undefined}
        data-state={selected ? 'selected' : undefined}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        display="flex"
        alignItems="center"
        minHeight={controlSize.height}
        height="auto"
        px="3r"
        py={controlSize.paddingBlock}
        boxSizing="border-box"
        borderRadius="sm"
        fontSize="3.5r"
        lineHeight="5r"
        cursor={disabled ? 'not-allowed' : 'pointer'}
        bg={selected ? 'ui.table.row.mutedBackground' : 'transparent'}
        color="design.text.base"
        opacity={disabled ? 0.5 : 1}
        outline="none"
        userSelect="none"
        _hover={!disabled ? { bg: 'ui.table.row.mutedBackground', color: 'design.text.base' } : undefined}
        _focus={{ bg: 'ui.table.row.mutedBackground', color: 'design.text.base', outline: 'none' }}
        _focusVisible={{ bg: 'ui.table.row.mutedBackground', color: 'design.text.base', outline: 'none' }}
        className={className}
        style={{
          minHeight: controlHeightPx,
          boxSizing: 'border-box',
          ...style,
        }}
        {...props}
        ref={ref}
      >
        {children}
      </Div>
    </RovingFocus.Item>
  )
})

export type MenuSeparatorProps = PrimitiveProps<'div'>

export const MenuSeparator = React.forwardRef<HTMLDivElement, MenuSeparatorProps>(
  function MenuSeparator({ className, style, ...props }: MenuSeparatorProps, ref) {
    return (
      <Div
        role="separator"
        height="1px"
        bg="ui.hr.border"
        my="1r"
        className={className}
        style={style}
        {...props}
        ref={ref}
      />
    )
  }
)

Menu.Item = MenuItem
Menu.Separator = MenuSeparator
