/**
 * The root Menu: adopts its Popover layer, owns the submenu registry,
 * and renders the vertical roving menu. Takes menu props with an
 * optional authored id; warns on nested-only props, derives a stable
 * id from the Overlay layer, and composes entry focus, close restore,
 * and contextmenu-dismiss hooks over the Tab/Escape key handling.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'
import { useOverlay } from '../../Overlay'
import { RovingFocus } from '../../RovingFocus'
import { MenuLevelContext } from '../context'
import { findNextTabbable, restoreFocusToTrigger } from '../focus/restore'
import { handleContentContainerKey } from '../focus/items'
import {
  useCloseRestore,
  useContextMenuDismiss,
  useEntryFocus,
  useRootLevel,
} from '../hooks'
import { devWarn } from '../shared/warn'
import type { MenuProps } from '../types'

// First-seen menu id per Overlay root. Overlay (and its triggerRef object)
// outlives Menu across Presence remounts; on real useId the derived value is
// identical at every sighting, and on the React 17 shim (fresh id per
// render) the memo holds the first one. One root Menu per Popover.
const menuIdByTriggerRef = new WeakMap<object, string>()

export const RootMenu: React.ForwardRefExoticComponent<
  MenuProps & React.RefAttributes<HTMLDivElement>
> = React.forwardRef<HTMLDivElement, MenuProps>(function RootMenu(
  { children, className, style, onKeyDown, id: authoredId, open, onOpen, onDismiss, ...props }: MenuProps,
  ref
) {
if (open !== undefined || onOpen !== undefined || onDismiss !== undefined) {
    devWarn('Menu `open`/`onOpen`/`onDismiss` apply only to nested Menu. Root open state lives on the wrapping Popover.')
  }

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
  const { levelValue } = useRootLevel({ overlay, isOpen, menuId, menuRef })

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

  useEntryFocus({ isOpen, menuRef })
  useCloseRestore({ isOpen, menuRef, overlay })
  useContextMenuDismiss({ isOpen, menuRef, levelValue })

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
      // Level-local Escape: an open submenu absorbs this key; only a
      // submenu-free tree closes the root.
      if (levelValue.requestDeepestClose()) return
      overlay.setIsOpen(false)
      restoreFocusToTrigger(overlay.triggerRef.current as HTMLElement | null)
    } else {
      // B-33: arrows/Home/End with focus on the container itself move to
      // the edge item. No-ops unless the container is the key target.
      handleContentContainerKey(e, menuRef.current)
    }
  }

  return (
    <MenuLevelContext.Provider value={levelValue}>
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
    </MenuLevelContext.Provider>
  )
})
