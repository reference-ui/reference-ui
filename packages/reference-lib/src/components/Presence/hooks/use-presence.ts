import * as React from 'react'
import type {
  PresenceContextValue,
  PresenceState,
  UsePresenceOptions,
} from '../types'
import { PresenceContext, PresenceCoordinatorContext } from '../context'
import { nextPresenceId } from '../shared/ids'
import { ExitGuard } from '../exit/guard'
import { detectExitEffects } from '../exit/detect'
import { watchExitCompletion } from '../exit/watch'
import { hasActiveFiniteAnimations } from '../exit/animations'
import {
  createDescendantRegistry,
  type DescendantRegistry,
} from '../nesting/registry'

/**
 * Exit-lifecycle kernel behind `<Presence>` (and Toast's swipe-to-dismiss).
 * Owns the Radix-lifted state machine (`mounted` → `unmountSuspended` →
 * `unmounted`): on close it asks `exit/detect` whether any finite effect
 * holds the exit and either removes instantly or suspends the unmount until
 * `exit/watch` signals completion; every completion path funnels through one
 * `ExitGuard` so `onExitComplete` fires exactly once per completed exit,
 * never for interruptions or initial mount. Nested descendants register at
 * exit-start through the provided `contextValue`, and sibling parts
 * coordinate through `PresenceCoordinatorContext`. Returns `isPresent` for
 * conditional rendering, the observer `ref` for the child node, and the
 * `contextValue` to provide to descendants.
 */

export function usePresence(present: boolean, options?: UsePresenceOptions) {
  const hasChild = options?.hasChild ?? true
  const onExitCompleteRef = React.useRef(options?.onExitComplete)
  onExitCompleteRef.current = options?.onExitComplete

  const guardRef = React.useRef<ExitGuard | null>(null)
  if (guardRef.current === null) {
    guardRef.current = new ExitGuard()
  }
  const guard = guardRef.current

  const [, setNode] = React.useState<HTMLElement | null>(null)
  const nodeRef = React.useRef<HTMLElement | null>(null)
  const [state, setState] = React.useState<PresenceState>(
    present ? 'mounted' : 'unmounted'
  )
  const stateRef = React.useRef(state)
  stateRef.current = state
  const prevPresentRef = React.useRef(present)
  const prevAnimationNameRef = React.useRef<string>('none')
  const isOwnAnimationDoneRef = React.useRef(false)

  const parentPresence = React.useContext(PresenceContext)
  const coordinator = React.useContext(PresenceCoordinatorContext)
  const presenceIdRef = React.useRef<string | null>(null)
  if (presenceIdRef.current === null) {
    presenceIdRef.current = nextPresenceId()
  }
  const presenceId = presenceIdRef.current

  // Complete a live exit exactly once. Centralized so every completion
  // path (event, WAAPI, GSAP, fallback, descendant release, coordinator
  // release, instant) reports through one guard. Fires synchronously: a
  // nested child can complete in the same commit its parent removes the
  // subtree, and a post-commit effect on the deleted fiber would never run.
  const finishExit = React.useCallback(() => {
    if (!guard.complete()) return
    setState('unmounted')
    onExitCompleteRef.current?.()
    if (parentPresence) {
      parentPresence.onDescendantExitComplete(presenceId)
    }
  }, [guard, parentPresence, presenceId])

  const finishExitRef = React.useRef(finishExit)
  finishExitRef.current = finishExit

  const registryRef = React.useRef<DescendantRegistry | null>(null)
  if (registryRef.current === null) {
    registryRef.current = createDescendantRegistry(() => {
      if (
        stateRef.current === 'unmountSuspended' &&
        isOwnAnimationDoneRef.current &&
        registryRef.current!.size === 0
      ) {
        finishExitRef.current()
      }
    })
  }
  const registry = registryRef.current

  // Update node ref synchronously
  const refCallback = React.useCallback((element: HTMLElement | null) => {
    nodeRef.current = element
    setNode(element)
  }, [])

  // Sync state transitions
  React.useLayoutEffect(() => {
    const el = nodeRef.current
    const prevPresent = prevPresentRef.current
    prevPresentRef.current = present

    if (present) {
      // Returning to present cancels the pending exit: an interrupted exit
      // never reports completion.
      guard.cancel()
      setState('mounted')
      if (el) {
        try {
          const styles = window.getComputedStyle(el)
          prevAnimationNameRef.current = styles.animationName || 'none'
        } catch {
          // ignore in non-browser env
        }
      }
      if (parentPresence) {
        parentPresence.unregisterDescendant(presenceId)
      }
      return
    }

    // Transitioning from present to not present
    if (prevPresent && !present) {
      guard.begin()
      if (typeof window === 'undefined' || !hasChild) {
        finishExit()
        return
      }

      if (!el) {
        // PR-DOM-08: Fail descriptively when child does not expose an observable node
        throw new Error(
          'Reference UI: Presence child must expose an observable DOM node. Ensure custom components forward ref.'
        )
      }

      // Check document visibility
      if (document.visibilityState === 'hidden') {
        finishExit()
        return
      }

      const styles = window.getComputedStyle(el)
      if (styles.display === 'none') {
        finishExit()
        return
      }

      const { hasFiniteAnimation, hasFiniteTransition, hasFiniteGsap } =
        detectExitEffects(el, prevAnimationNameRef.current)

      if (!hasFiniteAnimation && !hasFiniteTransition && !hasFiniteGsap) {
        if (coordinator && coordinator.isCoordinatorActive()) {
          isOwnAnimationDoneRef.current = true
          coordinator.reportPartFinished(presenceId)
          if (parentPresence) {
            parentPresence.registerDescendant(presenceId)
          }
          setState('unmountSuspended')
          return
        }
        finishExit()
        return
      }

      // Suspend unmount while transitions/animations/GSAP tweens complete.
      // The parent waits only for descendants that are actually exiting: a
      // born-closed instance never suspends, so it never registers and can no
      // longer strand the parent's exit.
      if (parentPresence) {
        parentPresence.registerDescendant(presenceId)
      }
      setState('unmountSuspended')
    }
  }, [present, presenceId, parentPresence, coordinator, finishExit, guard, hasChild])

  // Register with coordinator on mount
  React.useLayoutEffect(() => {
    if (coordinator) {
      coordinator.registerPart(presenceId)
      return () => {
        coordinator.unregisterPart(presenceId)
      }
    }
  }, [coordinator, presenceId])

  // Subscribe to allComplete from coordinator
  React.useEffect(() => {
    if (!coordinator) return
    return coordinator.subscribeToAllComplete(() => {
      if (stateRef.current === 'unmountSuspended') {
        finishExit()
      }
    })
  }, [coordinator, parentPresence, presenceId, finishExit])

  // Release an exit-start registration if this instance is removed mid-exit
  // (PR-NEST-03). Registration itself happens at exit-start above, never on
  // mount: born-closed descendants have no exit to report, so registering
  // them would strand the parent forever.
  React.useEffect(() => {
    if (parentPresence) {
      return () => {
        parentPresence.unregisterDescendant(presenceId)
      }
    }
  }, [parentPresence, presenceId])

  // Listen for animation and transition end events on the node
  React.useEffect(() => {
    if (state === 'mounted') {
      isOwnAnimationDoneRef.current = false
    }
  }, [state])

  React.useEffect(() => {
    const el = nodeRef.current
    if (!el || state !== 'unmountSuspended') {
      return
    }

    const handleExitComplete = () => {
      if (prevPresentRef.current || stateRef.current !== 'unmountSuspended') {
        return
      }
      if (typeof el.getAnimations === 'function') {
        if (hasActiveFiniteAnimations(el.getAnimations({ subtree: false }))) {
          return
        }
      }
      isOwnAnimationDoneRef.current = true
      if (registry.size > 0) {
        // Wait for descendants to finish
        return
      }
      if (coordinator && coordinator.isCoordinatorActive()) {
        coordinator.reportPartFinished(presenceId)
        return
      }
      finishExit()
    }

    return watchExitCompletion(el, handleExitComplete)
  }, [state, presenceId, parentPresence, finishExit, coordinator, registry])

  const contextValue = React.useMemo<PresenceContextValue>(() => {
    return {
      registerDescendant: (id: string) => {
        registry.register(id)
      },
      unregisterDescendant: (id: string) => {
        registry.unregister(id)
      },
      onDescendantExitComplete: (id: string) => {
        registry.complete(id)
      },
    }
  }, [presenceId, parentPresence, finishExit, registry])

  const isPresent = state === 'mounted' || state === 'unmountSuspended'

  return {
    isPresent,
    ref: refCallback,
    contextValue,
  }
}
