import * as React from 'react'
import { finiteGsapTweens } from '../../motion/gsap'
import { getElementRef } from './elementRef'

export interface PresenceProps {
  children?: React.ReactElement | null | false
  present: boolean
  /** Fires exactly once when content unmounts after a completed exit. Never on interrupted exits or initial mount. */
  onExitComplete?: () => void
}

type PresenceState = 'mounted' | 'unmountSuspended' | 'unmounted'

interface PresenceContextValue {
  registerDescendant: (id: string) => void
  unregisterDescendant: (id: string) => void
  onDescendantExitComplete: (id: string) => void
}

const PresenceContext = React.createContext<PresenceContextValue | null>(null)

export interface PresenceCoordinatorContextValue {
  registerPart: (id: string) => void
  unregisterPart: (id: string) => void
  reportPartFinished: (id: string) => void
  subscribeToAllComplete: (cb: () => void) => () => void
  isCoordinatorActive: () => boolean
}

export const PresenceCoordinatorContext =
  React.createContext<PresenceCoordinatorContextValue | null>(null)

export function usePresenceCoordinator(present: boolean): PresenceCoordinatorContextValue {
  const registeredParts = React.useRef<Set<string>>(new Set())
  const finishedParts = React.useRef<Set<string>>(new Set())
  const subscribers = React.useRef<Set<() => void>>(new Set())
  const presentRef = React.useRef(present)
  presentRef.current = present

  React.useEffect(() => {
    if (present) {
      finishedParts.current.clear()
    }
  }, [present])

  const notifyAllComplete = React.useCallback(() => {
    if (!presentRef.current) {
      if (
        registeredParts.current.size > 0 &&
        finishedParts.current.size >= registeredParts.current.size
      ) {
        subscribers.current.forEach(cb => cb())
      }
    }
  }, [])

  const registerPart = React.useCallback((id: string) => {
    registeredParts.current.add(id)
  }, [])

  const unregisterPart = React.useCallback(
    (id: string) => {
      registeredParts.current.delete(id)
      finishedParts.current.delete(id)
      if (
        !presentRef.current &&
        registeredParts.current.size > 0 &&
        finishedParts.current.size >= registeredParts.current.size
      ) {
        queueMicrotask(notifyAllComplete)
      }
    },
    [notifyAllComplete]
  )

  const reportPartFinished = React.useCallback(
    (id: string) => {
      finishedParts.current.add(id)
      if (
        !presentRef.current &&
        registeredParts.current.size > 0 &&
        finishedParts.current.size >= registeredParts.current.size
      ) {
        queueMicrotask(notifyAllComplete)
      }
    },
    [notifyAllComplete]
  )

  const subscribeToAllComplete = React.useCallback((cb: () => void) => {
    subscribers.current.add(cb)
    return () => {
      subscribers.current.delete(cb)
    }
  }, [])

  const isCoordinatorActive = React.useCallback(() => {
    return !presentRef.current && registeredParts.current.size > 1
  }, [])

  return React.useMemo(
    () => ({
      registerPart,
      unregisterPart,
      reportPartFinished,
      subscribeToAllComplete,
      isCoordinatorActive,
    }),
    [
      registerPart,
      unregisterPart,
      reportPartFinished,
      subscribeToAllComplete,
      isCoordinatorActive,
    ]
  )
}

let presenceIdCounter = 0

function parseDuration(str: string): number {
  const trimmed = str.trim()
  if (!trimmed) return 0
  const val = parseFloat(trimmed)
  if (isNaN(val)) return 0
  return trimmed.endsWith('ms') ? val : val * 1000
}

export interface UsePresenceOptions {
  hasChild?: boolean
  onExitComplete?: () => void
}

export function usePresence(present: boolean, options?: UsePresenceOptions) {
  const hasChild = options?.hasChild ?? true
  const onExitCompleteRef = React.useRef(options?.onExitComplete)
  onExitCompleteRef.current = options?.onExitComplete
  const exitIdRef = React.useRef(0)
  const firedExitIdRef = React.useRef(0)
  const [node, setNode] = React.useState<HTMLElement | null>(null)
  const nodeRef = React.useRef<HTMLElement | null>(null)
  const [state, setState] = React.useState<PresenceState>(
    present ? 'mounted' : 'unmounted'
  )
  const prevPresentRef = React.useRef(present)
  const prevAnimationNameRef = React.useRef<string>('none')
  const pendingDescendantsRef = React.useRef<Set<string>>(new Set())

  const parentPresence = React.useContext(PresenceContext)
  const coordinator = React.useContext(PresenceCoordinatorContext)
  const presenceIdRef = React.useRef<string | null>(null)
  if (presenceIdRef.current === null) {
    presenceIdRef.current = `presence-${++presenceIdCounter}`
  }
  const presenceId = presenceIdRef.current

  // W-09: complete a live exit exactly once. Centralized so every completion
  // path (event, WAAPI, GSAP, fallback, descendant release, coordinator
  // release, instant) reports through one guard. Fires synchronously: a
  // nested child can complete in the same commit its parent removes the
  // subtree, and a post-commit effect on the deleted fiber would never run.
  const finishExit = React.useCallback(() => {
    if (exitIdRef.current <= firedExitIdRef.current) return
    firedExitIdRef.current = exitIdRef.current
    setState('unmounted')
    onExitCompleteRef.current?.()
    if (parentPresence) {
      parentPresence.onDescendantExitComplete(presenceId)
    }
  }, [parentPresence, presenceId])

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
      // never reports completion (W-09).
      firedExitIdRef.current = exitIdRef.current
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
      exitIdRef.current += 1
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

      // Parse animations
      const currentAnimationName = styles.animationName || 'none'
      const prevAnimationName = prevAnimationNameRef.current
      const isAnimationChanged =
        currentAnimationName !== 'none' && currentAnimationName !== prevAnimationName

      let hasFiniteAnimation = false
      if (isAnimationChanged) {
        const animDurations = (styles.animationDuration || '').split(',').map(parseDuration)
        const animDelays = (styles.animationDelay || '').split(',').map(parseDuration)
        const animIterations = (styles.animationIterationCount || '').split(',')
        const animNames = currentAnimationName.split(',').map(s => s.trim())

        for (let i = 0; i < animNames.length; i++) {
          const dur = animDurations[i % animDurations.length] || 0
          const del = animDelays[i % animDelays.length] || 0
          const iter = animIterations[i % animIterations.length]?.trim() || '1'
          const name = animNames[i]
          if (name !== 'none' && iter !== 'infinite' && dur + del > 0) {
            hasFiniteAnimation = true
            break
          }
        }
      }

      let hasFiniteTransition = false
      const transPropStr = styles.transitionProperty || 'none'
      if (transPropStr !== 'none') {
        const transProps = transPropStr.split(',').map(s => s.trim())
        const transDurations = (styles.transitionDuration || '').split(',').map(parseDuration)
        const transDelays = (styles.transitionDelay || '').split(',').map(parseDuration)

        for (let i = 0; i < transProps.length; i++) {
          const prop = transProps[i]
          const dur = transDurations[i % transDurations.length] || 0
          const del = transDelays[i % transDelays.length] || 0
          if (prop !== 'none' && dur + del > 0) {
            hasFiniteTransition = true
            break
          }
        }
      }

      // Check Web Animations API
      if (typeof el.getAnimations === 'function') {
        const anims = el.getAnimations({ subtree: false })
        const finiteAnims = anims.filter(a => {
          if (a.playState === 'finished') return false
          const effect = a.effect
          if (effect && 'getTiming' in effect) {
            const timing = effect.getTiming()
            const duration = typeof timing.duration === 'number' ? timing.duration : 0
            const delay = typeof timing.delay === 'number' ? timing.delay : 0
            const iterations = typeof timing.iterations === 'number' ? timing.iterations : 1
            return iterations !== Infinity && duration + delay > 0
          }
          return false
        })
        if (anims.length > 0 && finiteAnims.length === 0 && !hasFiniteTransition) {
          hasFiniteAnimation = false
        }
      }

      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      if (prefersReducedMotion) {
        // If reduced motion computes durations to 0s, styles check already captures it
      }

      const hasFiniteGsap = !prefersReducedMotion && finiteGsapTweens(el).length > 0

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
      // longer strand the parent's exit (B-01).
      if (parentPresence) {
        parentPresence.registerDescendant(presenceId)
      }
      setState('unmountSuspended')
    }
  }, [present, presenceId, parentPresence, coordinator, finishExit])

  const stateRef = React.useRef(state)
  stateRef.current = state

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
  // them would strand the parent forever (B-01).
  React.useEffect(() => {
    if (parentPresence) {
      return () => {
        parentPresence.unregisterDescendant(presenceId)
      }
    }
  }, [parentPresence, presenceId])

  // Listen for animation and transition end events on the node
  const isOwnAnimationDoneRef = React.useRef(false)

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

    let isCancelled = false
    let fillModeTimeoutId: number | undefined

    const checkAllCompleted = () => {
      if (typeof el.getAnimations === 'function') {
        const active = el.getAnimations({ subtree: false }).filter(a => {
          if (a.playState === 'finished') return false
          const timing = a.effect?.getTiming()
          if (!timing) return false
          if (timing.iterations === Infinity) return false
          const duration = typeof timing.duration === 'number' ? timing.duration : 0
          const delay = typeof timing.delay === 'number' ? timing.delay : 0
          return duration + delay > 0
        })
        if (active.length > 0) {
          return false
        }
      }
      return true
    }

    const handleExitComplete = () => {
      if (prevPresentRef.current || stateRef.current !== 'unmountSuspended') {
        return
      }
      if (!checkAllCompleted()) {
        return
      }
      isOwnAnimationDoneRef.current = true
      if (pendingDescendantsRef.current.size > 0) {
        // Wait for descendants to finish
        return
      }
      if (coordinator && coordinator.isCoordinatorActive()) {
        coordinator.reportPartFinished(presenceId)
        return
      }
      finishExit()
    }

    const onAnimationEnd = (event: AnimationEvent) => {
      if (event.target === el) {
        if (!prevPresentRef.current) {
          // PR-ANIMATION-02: prevent final-frame flash by holding forwards fillMode
          const currentFillMode = el.style.animationFillMode
          el.style.animationFillMode = 'forwards'
          fillModeTimeoutId = window.setTimeout(() => {
            if (el.style.animationFillMode === 'forwards') {
              el.style.animationFillMode = currentFillMode
            }
          })
        }
        handleExitComplete()
      }
    }

    const onAnimationCancel = (event: AnimationEvent) => {
      if (event.target === el) {
        handleExitComplete()
      }
    }

    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target === el) {
        handleExitComplete()
      }
    }

    const onTransitionCancel = (event: TransitionEvent) => {
      if (event.target === el) {
        handleExitComplete()
      }
    }

    el.addEventListener('animationend', onAnimationEnd)
    el.addEventListener('animationcancel', onAnimationCancel)
    el.addEventListener('transitionend', onTransitionEnd)
    el.addEventListener('transitioncancel', onTransitionCancel)

    // Also attach to getAnimations if present
    if (typeof el.getAnimations === 'function') {
      const anims = el.getAnimations({ subtree: false }).filter(a => {
        const timing = a.effect?.getTiming()
        return timing?.iterations !== Infinity
      })
      if (anims.length > 0) {
        Promise.allSettled(anims.map(a => a.finished)).then(() => {
          if (!isCancelled) {
            handleExitComplete()
          }
        })
      }
    }

    let gsapCancelled = false
    const gsapTweens = finiteGsapTweens(el)
    if (gsapTweens.length > 0) {
      Promise.all(gsapTweens.map((tween: gsap.core.Tween) => tween.then())).then(() => {
        if (!gsapCancelled) handleExitComplete()
      })
    }

    // Fallback timer in case events don't fire
    const fallbackTimer = setTimeout(() => {
      handleExitComplete()
    }, 5000)

    return () => {
      isCancelled = true
      gsapCancelled = true
      window.clearTimeout(fillModeTimeoutId)
      clearTimeout(fallbackTimer)
      el.removeEventListener('animationend', onAnimationEnd)
      el.removeEventListener('animationcancel', onAnimationCancel)
      el.removeEventListener('transitionend', onTransitionEnd)
      el.removeEventListener('transitioncancel', onTransitionCancel)
    }
  }, [state, presenceId, parentPresence, finishExit])

  const contextValue = React.useMemo<PresenceContextValue>(() => {
    return {
      registerDescendant: (id: string) => {
        pendingDescendantsRef.current.add(id)
      },
      unregisterDescendant: (id: string) => {
        pendingDescendantsRef.current.delete(id)
        if (
          stateRef.current === 'unmountSuspended' &&
          isOwnAnimationDoneRef.current &&
          pendingDescendantsRef.current.size === 0
        ) {
          finishExit()
        }
      },
      onDescendantExitComplete: (id: string) => {
        pendingDescendantsRef.current.delete(id)
        if (
          stateRef.current === 'unmountSuspended' &&
          isOwnAnimationDoneRef.current &&
          pendingDescendantsRef.current.size === 0
        ) {
          finishExit()
        }
      },
    }
  }, [presenceId, parentPresence, finishExit])

  const isPresent = state === 'mounted' || state === 'unmountSuspended'

  return {
    isPresent,
    ref: refCallback,
    contextValue,
  }
}

type PossibleRef<T> = React.Ref<T> | undefined

function setRef<T>(ref: PossibleRef<T>, value: T | null) {
  if (typeof ref === 'function') {
    return ref(value)
  } else if (ref && typeof ref === 'object' && 'current' in ref) {
    ;(ref as React.MutableRefObject<T | null>).current = value
  }
}

function useStableComposedRefs<T>(...refs: PossibleRef<T>[]): React.RefCallback<T> {
  const refsRef = React.useRef(refs)
  refsRef.current = refs

  return React.useCallback((node: T | null) => {
    const currentRefs = refsRef.current
    let hasCleanup = false
    const cleanups = currentRefs.map((ref) => {
      const cleanup = setRef(ref, node)
      if (!hasCleanup && typeof cleanup === 'function') {
        hasCleanup = true
      }
      return cleanup
    })

    if (hasCleanup) {
      return () => {
        for (let i = 0; i < cleanups.length; i++) {
          const cleanup = cleanups[i]
          if (typeof cleanup === 'function') {
            cleanup()
          } else {
            setRef(currentRefs[i], null)
          }
        }
      }
    }
  }, [])
}

export function Presence({ children, present, onExitComplete }: PresenceProps) {
  // PR-DOM-06: Reject text or non-element children early if nonempty
  if (children !== null && children !== false && children !== undefined) {
    if (React.isValidElement(children) && children.type === React.Fragment) {
      const fragChildren = (children.props as any)?.children
      if (!fragChildren || React.Children.count(fragChildren) === 0) {
        // Empty fragment is treated as falsy/empty child
      } else {
        throw new Error(
          'Reference UI: Presence expects a single valid React element child.'
        )
      }
    } else if (typeof children !== 'object' || !React.isValidElement(children)) {
      throw new Error(
        'Reference UI: Presence expects a single valid React element child.'
      )
    }
  }

  const isChildEmpty =
    children === null ||
    children === false ||
    children === undefined ||
    (React.isValidElement(children) &&
      children.type === React.Fragment &&
      (!(children.props as any)?.children ||
        React.Children.count((children.props as any).children) === 0))

  const { isPresent, ref, contextValue } = usePresence(present, {
    hasChild: !isChildEmpty,
    onExitComplete,
  })

  const child =
    React.isValidElement(children) && children.type !== React.Fragment
      ? (children as React.ReactElement<any>)
      : null
  const originalRef = child ? getElementRef(child) : undefined
  const composedRef = useStableComposedRefs(ref, originalRef)

  if (!isPresent || !child) {
    return null
  }

  return (
    <PresenceContext.Provider value={contextValue}>
      {React.cloneElement(child, {
        ref: composedRef,
      })}
    </PresenceContext.Provider>
  )
}
