/**
 * One submenu level: stable registration identity, intent timers, and
 * the child level value. Takes the parent level, overlay, open flag,
 * and returns the level value, reconciled content id, and intent
 * state. Open and request fields refresh per render while identity
 * stays put; timers die with the level and travel samples reset on
 * close.
 */
import * as React from 'react'
import { useOverlay } from '../../Overlay'
import type { MenuLevelValue, SubmenuRegistration } from '../context'
import type { SubmenuIntentState } from '../levels/intent-state'
import { clearIntentTimer, freshIntentState } from '../levels/intent-state'
import { isLevelDescendantOf, openRegistrationsDeepestFirst } from '../levels/registry'

export function useNestedLevel({ parentLevel, overlay, isOpen }: {
  parentLevel: MenuLevelValue
  overlay: ReturnType<typeof useOverlay>
  isOpen: boolean
}): { levelValue: MenuLevelValue; contentId: string; intent: SubmenuIntentState } {
const intentRef = React.useRef<SubmenuIntentState | null>(null)
  if (!intentRef.current) intentRef.current = freshIntentState()
  const intent = intentRef.current

  const generatedId = React.useId()
  const stableIdRef = React.useRef<string | null>(null)
  if (stableIdRef.current === null) {
    stableIdRef.current = `menu-${String(generatedId).replace(/[^a-zA-Z0-9_-]/g, '')}`
  }
  // Authored Content ids reconcile through state so Trigger aria-controls
  // never points at a stale duplicate.
  const [contentId, setContentId] = React.useState(stableIdRef.current)

  const isOpenRef = React.useRef(isOpen)
  isOpenRef.current = isOpen
  const overlayRef = React.useRef(overlay)
  overlayRef.current = overlay

  // Registration identity is stable; open/request fields refresh per render.
  const regRef = React.useRef<SubmenuRegistration | null>(null)
  if (!regRef.current) {
    regRef.current = {
      id: contentId,
      depth: parentLevel.depth + 1,
      parentId: parentLevel.id,
      isOpen,
      getTrigger: () => overlayRef.current?.triggerRef.current ?? null,
      getContent: () => overlayRef.current?.contentRef.current ?? null,
      requestClose: () => {},
    }
  }
  const reg = regRef.current
  reg.id = contentId
  reg.isOpen = isOpen
  reg.requestClose = () => {
    overlayRef.current?.setIsOpen(false)
  }

  React.useEffect(() => parentLevel.registerSubmenu(reg), [parentLevel, reg, contentId])

  // Intent timers die with the level; open state resets travel samples.
  React.useEffect(() => {
    if (!isOpen) {
      clearIntentTimer(intent, 'openTimer')
      clearIntentTimer(intent, 'closeTimer')
      intent.leavePoint = null
      intent.prevSample = null
      intent.closeRequested = false
    }
  }, [isOpen, intent])
  React.useEffect(() => {
    const state = intentRef.current
    return () => {
      if (state) {
        clearIntentTimer(state, 'openTimer')
        clearIntentTimer(state, 'closeTimer')
      }
    }
  }, [])

  const requestClose = React.useCallback(() => {
    overlayRef.current?.setIsOpen(false)
  }, [])
  const requestOpen = React.useCallback(() => {
    overlayRef.current?.setIsOpen(true)
  }, [])
  const getTrigger = React.useCallback(
    () => overlayRef.current?.triggerRef.current ?? null,
    []
  )
  const getContentNode = React.useCallback(
    () => overlayRef.current?.contentRef.current ?? null,
    []
  )
  const requestDeepestClose = React.useCallback(() => {
    // Deepest open descendant absorbs; else this level closes itself.
    const registry = parentLevel.registry
    for (const candidate of openRegistrationsDeepestFirst(registry)) {
      if (candidate.id === contentId || isLevelDescendantOf(registry, candidate.id, contentId)) {
        candidate.requestClose()
        return true
      }
    }
    requestClose()
    return true
  }, [parentLevel, contentId, requestClose])

  const levelValue = React.useMemo<MenuLevelValue>(
    () => ({
      id: contentId,
      depth: parentLevel.depth + 1,
      isSubmenu: true,
      isOpen,
      contentId,
      getContentNode,
      getTrigger,
      parent: parentLevel,
      intent,
      requestClose,
      requestOpen,
      requestDeepestClose,
      requestTreeDismiss: parentLevel.requestTreeDismiss,
      registerSubmenu: parentLevel.registerSubmenu,
      unwindForPress: parentLevel.unwindForPress,
      registry: parentLevel.registry,
      setContentId,
    }),
    [
      contentId,
      parentLevel,
      isOpen,
      getContentNode,
      getTrigger,
      intent,
      requestClose,
      requestOpen,
      requestDeepestClose,
      setContentId,
    ]
  )
  return { levelValue, contentId, intent }
}
