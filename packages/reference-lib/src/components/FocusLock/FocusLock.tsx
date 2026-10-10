/**
 * FocusLock root: transparent containment with no wrapper node. The component
 * composes the session, shard, memory, restore, activation, and containment
 * hooks in effect order, then slots the behavior onto its single child
 * element — validating the child shape and fanning the host node into the
 * composed ref. Overlay mounts this when isolation focus is on.
 */
import * as React from 'react'
import { getElementRef } from '../Presence/shared/element-ref'
import type { FocusLockProps } from './types'
import {
  useActivation,
  useComposedRef,
  useContainment,
  useInsideMemory,
  useLockSession,
  useRestore,
  useShards,
} from './hooks'

export type { FocusLockProps, FocusTarget } from './types'

export const FocusLock = React.forwardRef<HTMLElement, FocusLockProps>(
  function FocusLock(
    {
      children,
      disabled = false,
      initialFocus,
      restoreFocus = true,
      defaultRestoreTarget,
      shards: shardsProp,
    },
    forwardedRef
  ) {
    const session = useLockSession({
      initialFocus,
      restoreFocus,
      defaultRestoreTarget,
      forwardedRef,
    })
    useShards(session, shardsProp)
    const composedRef = useComposedRef(session)
    const { rememberInside, pickInsideFallback } = useInsideMemory(session)
    const { restoreOnce, scheduleRestore } = useRestore(session)

    useActivation(session, { disabled, rememberInside, restoreOnce, scheduleRestore })
    useContainment(session, { disabled, rememberInside, pickInsideFallback })

    if (!children) {
      return null
    }

    if (typeof children !== 'object' || !React.isValidElement(children)) {
      throw new Error('Reference UI: FocusLock expects a single valid React element child.')
    }

    if (children.type === React.Fragment) {
      throw new Error('Reference UI: FocusLock expects a single valid React element child.')
    }

    const child = children as React.ReactElement<{ ref?: React.Ref<HTMLElement> }>
    session.latestChildRef.current = getElementRef(child) as React.Ref<HTMLElement> | undefined

    return React.cloneElement(child, {
      ref: composedRef,
    })
  }
)
FocusLock.displayName = 'FocusLock'
