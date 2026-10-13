/**
 * Menubar.Trigger: a roving Popover trigger with Menu keyboard entry.
 * Takes Popover trigger props, registers its node for DOM-ordered moves,
 * and resolves the mounted button by stable id where cloneElement refs
 * die (React 17/18). Arrows move focus via RovingFocus and, when a menu
 * is open, switch the bar value to the newly focused trigger's menu.
 */
import * as React from 'react'
import { Popover } from '../../Popover'
import { useMenuTriggerKeys } from '../../Menu'
import { RovingFocus, getDirection } from '../../RovingFocus'
import { menubarArrowDirection } from '../nav/menubar-nav'
import { MenubarContext, MenubarMenuContext } from '../context'
import type { MenubarTriggerProps } from '../types'
import { devWarn } from '../shared/warn'

export const MenubarTrigger: React.ForwardRefExoticComponent<
  MenubarTriggerProps & React.RefAttributes<HTMLButtonElement>
> = React.forwardRef<HTMLButtonElement, MenubarTriggerProps>(
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

    const generatedId = React.useId()
    const stableTriggerIdRef = React.useRef<string | null>(null)
    if (stableTriggerIdRef.current === null) {
      stableTriggerIdRef.current = `menubar-trigger-${String(generatedId).replace(/[^a-zA-Z0-9_-]/g, '')}`
    }
    const triggerId = authoredId ?? stableTriggerIdRef.current

    // Portable node resolution (Menu MenuTrigger precedent): the RovingFocus
    // cloneElement ref dies through plain-function Popover.Trigger on React
    // 17/18, so resolve the mounted button by stable id. Only-if-found: never
    // null a live ref on 19.
    React.useLayoutEffect(() => {
      if (typeof document === 'undefined') return
      const rootNode = menubar?.getRootNode() ?? null
      const scope = rootNode?.getRootNode?.() ?? document
      const doc =
        scope instanceof Document || (typeof ShadowRoot !== 'undefined' && scope instanceof ShadowRoot)
          ? scope
          : document
      const node = doc.getElementById(triggerId)
      if (node instanceof HTMLElement) nodeRef.current = node as HTMLButtonElement
    }, [menubar, triggerId])

    const getItemNode = React.useCallback(() => nodeRef.current, [])

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
      <RovingFocus.Item disabled={disabled} getNode={getItemNode}>
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
          id={triggerId}
        >
          {children}
        </Popover.Trigger>
      </RovingFocus.Item>
    )
  }
)
