/**
 * One lock's mutable session: the stable identity, container and memory
 * refs, restore bookkeeping, and latest-prop mirrors the activation and
 * containment effects share. Everything here is a ref or a stable callback,
 * so the session object memoizes to one identity and downstream effects keep
 * their exact original dependency behavior.
 */
import * as React from 'react'
import type { RestoreSnapshot } from '../restore/decision'
import { nextLockId } from '../shared/ids'
import type { FocusLockProps } from '../types'

export type FocusLockSession = {
  lockId: string
  containerRef: React.MutableRefObject<HTMLElement | null>
  lastFocusedNodeRef: React.MutableRefObject<HTMLElement | null>
  previousValidNodeRef: React.MutableRefObject<HTMLElement | null>
  previousActiveElementRef: React.MutableRefObject<RestoreSnapshot | null>
  restoredRef: React.MutableRefObject<boolean>
  restoreTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>
  addedTabIndexRef: React.MutableRefObject<boolean>
  movingFocusRef: React.MutableRefObject<boolean>
  restoreFocusRef: React.MutableRefObject<FocusLockProps['restoreFocus']>
  initialFocusRef: React.MutableRefObject<FocusLockProps['initialFocus']>
  defaultRestoreTargetRef: React.MutableRefObject<FocusLockProps['defaultRestoreTarget']>
  getResolvedShardsRef: React.MutableRefObject<() => HTMLElement[]>
  latestForwardedRef: React.MutableRefObject<React.Ref<HTMLElement>>
  latestChildRef: React.MutableRefObject<React.Ref<HTMLElement> | undefined>
}

export function useLockSession(options: {
  initialFocus: FocusLockProps['initialFocus']
  restoreFocus: FocusLockProps['restoreFocus']
  defaultRestoreTarget: FocusLockProps['defaultRestoreTarget']
  forwardedRef: React.Ref<HTMLElement>
}): FocusLockSession {
  const { initialFocus, restoreFocus, defaultRestoreTarget, forwardedRef } = options

  const containerRef = React.useRef<HTMLElement | null>(null)
  const lastFocusedNodeRef = React.useRef<HTMLElement | null>(null)
  const previousValidNodeRef = React.useRef<HTMLElement | null>(null)
  const previousActiveElementRef = React.useRef<RestoreSnapshot | null>(null)
  const restoredRef = React.useRef(false)
  const restoreTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const addedTabIndexRef = React.useRef(false)
  const movingFocusRef = React.useRef(false)

  const lockIdRef = React.useRef<string | null>(null)
  if (!lockIdRef.current) {
    lockIdRef.current = nextLockId()
  }
  const lockId = lockIdRef.current

  const restoreFocusRef = React.useRef(restoreFocus)
  restoreFocusRef.current = restoreFocus
  const initialFocusRef = React.useRef(initialFocus)
  initialFocusRef.current = initialFocus
  const defaultRestoreTargetRef = React.useRef(defaultRestoreTarget)
  defaultRestoreTargetRef.current = defaultRestoreTarget

  const getResolvedShardsRef = React.useRef<() => HTMLElement[]>(() => [])
  const latestForwardedRef = React.useRef(forwardedRef)
  latestForwardedRef.current = forwardedRef
  const latestChildRef = React.useRef<React.Ref<HTMLElement> | undefined>(undefined)

  return React.useMemo(
    () => ({
      lockId,
      containerRef,
      lastFocusedNodeRef,
      previousValidNodeRef,
      previousActiveElementRef,
      restoredRef,
      restoreTimerRef,
      addedTabIndexRef,
      movingFocusRef,
      restoreFocusRef,
      initialFocusRef,
      defaultRestoreTargetRef,
      getResolvedShardsRef,
      latestForwardedRef,
      latestChildRef,
    }),
    [
      lockId,
      containerRef,
      lastFocusedNodeRef,
      previousValidNodeRef,
      previousActiveElementRef,
      restoredRef,
      restoreTimerRef,
      addedTabIndexRef,
      movingFocusRef,
      restoreFocusRef,
      initialFocusRef,
      defaultRestoreTargetRef,
      getResolvedShardsRef,
      latestForwardedRef,
      latestChildRef,
    ]
  )
}
