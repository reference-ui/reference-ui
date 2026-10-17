/**
 * Menu.Content: the submenu panel. Takes Overlay content props with an
 * optional authored id and placement; reconciles authored ids to the
 * level so Trigger aria-controls follows, resolves the consumer ref
 * once Presence mounts, focuses the first item on keyboard-open entry,
 * and restores the trigger (or a live parent target) on close.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'
import { Overlay, useOverlay } from '../../Overlay'
import { RovingFocus } from '../../RovingFocus'
import { useMenuLevel } from '../context'
import { ENABLED_MENUITEM_SELECTOR, focusFirstEnabledItem, handleContentContainerKey } from '../focus/items'
import { restoreFocusToTrigger } from '../focus/restore'
import { activeElementIn } from '../focus/scope'
import { levelDirection, rootTriggerOf } from '../levels/registry'
import { devWarn } from '../shared/warn'
import type { MenuContentProps } from '../types'

export const MenuContent: React.ForwardRefExoticComponent<
  MenuContentProps & React.RefAttributes<HTMLDivElement>
> = React.forwardRef<HTMLDivElement, MenuContentProps>(function MenuContent(
  {
    children,
    id: authoredId,
    placement,
    onKeyDown,
    className,
    style,
    ...props
  }: MenuContentProps,
  ref
) {
  const level = useMenuLevel()
  const overlay = useOverlay()
  if (!level || !level.isSubmenu) {
    devWarn('Menu.Content is valid only when nested inside a submenu Menu.')
  }
  const isOpen = level?.isOpen ?? false

  // Authored ids reconcile to the level so Trigger aria-controls follows.
  React.useLayoutEffect(() => {
    if (authoredId && level?.setContentId && authoredId !== level.contentId) {
      level.setContentId(authoredId)
    }
  }, [authoredId, level])

  const contentId = authoredId ?? level?.contentId ?? undefined

  // Overlay.Content owns the host node; resolve the consumer ref once it is
  // mounted (a frame after open — Presence mounts a commit late) and release
  // it on close. Levels read the live node at use time instead.
  React.useEffect(() => {
    if (!isOpen) {
      if (typeof ref === 'function') {
        ref(null)
      } else if (ref && typeof ref === 'object' && 'current' in ref) {
        ;(ref as React.MutableRefObject<HTMLDivElement | null>).current = null
      }
      return
    }
    const frameId = requestAnimationFrame(() => {
      const node = overlay?.contentRef.current ?? null
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref && typeof ref === 'object' && 'current' in ref) {
        ;(ref as React.MutableRefObject<HTMLDivElement | null>).current = node
      }
    })
    return () => cancelAnimationFrame(frameId)
  }, [isOpen, overlay, ref])

  const resolvedPlacement =
    placement ?? (levelDirection(level) === 'rtl' ? 'left-start' : 'right-start')

  // Keyboard-open entry focus once per open; close restores the trigger
  // unless focus already left (outside press) or the trigger is gone
  // (fallback to a live parent target). Effects run deepest-first, so a
  // full-tree unwind lands on the root trigger last.
  const wasOpenRef = React.useRef(isOpen)
  React.useEffect(() => {
    const wasOpen = wasOpenRef.current
    wasOpenRef.current = isOpen
    if (!level || !level.isSubmenu) return
    if (!wasOpen && isOpen) {
      const keyboardOpen = level.intent?.keyboardOpen ?? false
      if (level.intent) level.intent.keyboardOpen = false
      if (!keyboardOpen) return
      const frameId = requestAnimationFrame(() => {
        focusFirstEnabledItem(level.getContentNode())
      })
      return () => cancelAnimationFrame(frameId)
    }
    if (wasOpen && !isOpen) {
      if (level.intent) level.intent.keyboardOpen = false
      const content = level.getContentNode()
      if (!content?.contains(activeElementIn(content))) return
      const trigger = level.getTrigger()
      if (trigger && trigger.isConnected && !trigger.hasAttribute('disabled') && trigger.getAttribute('aria-disabled') !== 'true') {
        trigger.focus()
        return
      }
      const parentContent = level.parent?.getContentNode() ?? null
      const fallback = parentContent?.querySelector<HTMLElement>(ENABLED_MENUITEM_SELECTOR) ?? null
      if (fallback) {
        fallback.focus()
        return
      }
      restoreFocusToTrigger(rootTriggerOf(level))
    }
    return undefined
  })

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || !level || !level.isSubmenu) return
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      level.requestDeepestClose()
      return
    }
    // Direction follows the root trigger: content portals to document.body
    // and loses the author's dir context (SUBKEY-04).
    const isRtl = levelDirection(level) === 'rtl'
    const closeKey = isRtl ? 'ArrowRight' : 'ArrowLeft'
    if (e.key === closeKey) {
      e.preventDefault()
      level.requestClose()
      return
    }
    // Submenu level: container-focused edge navigation.
    handleContentContainerKey(e, level.getContentNode())
  }

  return (
    <Overlay.Content
      placement={resolvedPlacement}
      {...props}
      role="menu"
      id={contentId}
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
    >
      <RovingFocus.Root orientation="vertical" loop typeahead>
        <Div display="flex" flexDirection="column" gap="0.5r" outline="none">
          {children}
        </Div>
      </RovingFocus.Root>
    </Overlay.Content>
  )
})
