/**
 * The root menu level: submenu registry plus tree operations over it.
 * Takes the overlay, open flag, menu id, and content ref; returns the
 * level value the root provides. Stable callbacks over mutable refs
 * so nested levels never churn subscriptions: registration, root
 * close, deepest-first close, full-tree dismiss, press unwinding, and
 * the live trigger and content reads.
 */
import * as React from 'react'
import { isEventInside, useOverlay } from '../../Overlay'
import type { MenuLevelValue, SubmenuRegistration } from '../context'
import { MENU_ROOT_ID, openRegistrationsDeepestFirst } from '../levels/registry'

export function useRootLevel({ overlay, isOpen, menuId, menuRef }: {
  overlay: ReturnType<typeof useOverlay>
  isOpen: boolean
  menuId: string
  menuRef: React.RefObject<HTMLDivElement | null>
}): { levelValue: MenuLevelValue } {
// Submenu registry + tree operations. Stable callbacks over mutable refs
  // so nested levels never churn subscriptions when open state changes.
  const registryRef = React.useRef(new Map<string, SubmenuRegistration>())
  const overlayRef = React.useRef(overlay)
  overlayRef.current = overlay

  const registerSubmenu = React.useCallback((reg: SubmenuRegistration) => {
    const registry = registryRef.current
    registry.set(reg.id, reg)
    return () => {
      for (const [key, value] of registry) {
        if (value === reg) registry.delete(key)
      }
    }
  }, [])

  const requestRootClose = React.useCallback(() => {
    overlayRef.current?.setIsOpen(false)
  }, [])

  const requestRootDeepestClose = React.useCallback(() => {
    for (const reg of openRegistrationsDeepestFirst(registryRef.current)) {
      reg.requestClose()
      return true
    }
    return false
  }, [])

  const requestRootTreeDismiss = React.useCallback(() => {
    for (const reg of openRegistrationsDeepestFirst(registryRef.current)) {
      reg.requestClose()
    }
    overlayRef.current?.setIsOpen(false)
  }, [])

  const unwindForPress = React.useCallback(
    (event: Event) => {
      const registry = registryRef.current
      // Keep levels containing the press plus their ancestors; close every
      // other open submenu deepest-first. A press outside the whole tree
      // additionally closes the root. Containment reads the composed path:
      // event.target retargets to the shadow host for shadow-internal
      // presses, so a bare target check would unwind the whole tree.
      const keep = new Set<string>()
      for (const reg of registry.values()) {
        if (isEventInside(reg.getTrigger(), event) || isEventInside(reg.getContent(), event)) {
          keep.add(reg.id)
          let ancestorId: string | undefined = reg.parentId
          while (ancestorId && ancestorId !== MENU_ROOT_ID) {
            keep.add(ancestorId)
            ancestorId = registry.get(ancestorId)?.parentId
          }
        }
      }
      const rootContent = menuRef.current
      const rootTrigger = overlayRef.current?.triggerRef.current ?? null
      const rootKept = isEventInside(rootContent, event) || isEventInside(rootTrigger, event)
      for (const reg of openRegistrationsDeepestFirst(registry)) {
        if (!keep.has(reg.id)) reg.requestClose()
      }
      if (!rootKept && keep.size === 0) {
        overlayRef.current?.setIsOpen(false)
      }
    },
    []
  )

  const getRootTrigger = React.useCallback(() => {
    return (overlayRef.current?.triggerRef.current as HTMLElement | null) ?? null
  }, [])

  const getRootContentNode = React.useCallback(() => menuRef.current, [])

  const levelValue = React.useMemo<MenuLevelValue>(
    () => ({
      id: MENU_ROOT_ID,
      depth: 0,
      isSubmenu: false,
      isOpen,
      contentId: menuId,
      getContentNode: getRootContentNode,
      getTrigger: getRootTrigger,
      parent: null,
      intent: null,
      requestClose: requestRootClose,
      requestOpen: () => overlayRef.current?.setIsOpen(true),
      requestDeepestClose: requestRootDeepestClose,
      requestTreeDismiss: requestRootTreeDismiss,
      registerSubmenu,
      unwindForPress,
      registry: registryRef.current,
      setContentId: null,
    }),
    [
      isOpen,
      menuId,
      getRootContentNode,
      getRootTrigger,
      requestRootClose,
      requestRootDeepestClose,
      requestRootTreeDismiss,
      registerSubmenu,
      unwindForPress,
    ]
  )
  return { levelValue }
}
