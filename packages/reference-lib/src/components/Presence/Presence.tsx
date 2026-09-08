import * as React from 'react'
import { finiteGsapTweens } from '../../motion/gsap'

export interface PresenceProps {
  children?: React.ReactElement | null | false
  present: boolean
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

export function usePresence(present: boolean) {
  const [node, setNode] = React.useState<HTMLElement | null>(null)
  const nodeRef = React.useRef<HTMLElement | null>(null)
  const [state, setState] = React.useState<PresenceState>(
    present ? 'mounted' : 'unmounted'
  )
  const prevPresentRef = React.useRef(present)
  const prevAnimationNameRef = React.useRef<string>('none')
  const pendingDescendantsRef = React.useRef<Set<string>>(new Set())
  const [, forceUpdate] = React.useReducer(x => x + 1, 0)

  const parentPresence = React.useContext(PresenceContext)
  const coordinator = React.useContext(PresenceCoordinatorContext)
  const presenceIdRef = React.useRef<string | null>(null)
  if (presenceIdRef.current === null) {
    presenceIdRef.current = `presence-${++presenceIdCounter}`
  }
  const presenceId = presenceIdRef.current

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
      // Transitioning to present or staying present
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
      if (!el || typeof window === 'undefined') {
        setState('unmounted')
        return
      }

      // Check document visibility
      if (document.visibilityState === 'hidden') {
        setState('unmounted')
        if (parentPresence) {
          parentPresence.onDescendantExitComplete(presenceId)
        }
        return
      }

      const styles = window.getComputedStyle(el)
      if (styles.display === 'none') {
        setState('unmounted')
        if (parentPresence) {
          parentPresence.onDescendantExitComplete(presenceId)
        }
        return
      }

      // Parse animations
      const currentAnimationName = styles.animationName || 'none'
      const prevAnimationName = prevAnimationNameRef.current
      const isAnimationChanged =
        currentAnimationName !== 'none' && currentAnimationName !== prevAnimationName

      // Check if there are active CSS transitions or animations
      let hasFiniteAnimation = false
      if (isAnimationChanged) {
        const animDurations = (styles.animationDuration || '')
          .split(',')
          .map(s => parseFloat(s) * (s.includes('ms') ? 1 : 1000))
        const animDelays = (styles.animationDelay || '')
          .split(',')
          .map(s => parseFloat(s) * (s.includes('ms') ? 1 : 1000))
        const animIterations = (styles.animationIterationCount || '').split(',')

        for (let i = 0; i < animDurations.length; i++) {
          const dur = animDurations[i] || 0
          const del = animDelays[i] || 0
          const iter = animIterations[i] ? animIterations[i].trim() : '1'
          if (iter !== 'infinite' && dur + del > 0) {
            hasFiniteAnimation = true
            break
          }
        }
      }

      let hasFiniteTransition = false
      const transProps = (styles.transitionProperty || '').split(',')
      const transDurations = (styles.transitionDuration || '')
        .split(',')
        .map(s => parseFloat(s) * (s.includes('ms') ? 1 : 1000))
      const transDelays = (styles.transitionDelay || '')
        .split(',')
        .map(s => parseFloat(s) * (s.includes('ms') ? 1 : 1000))

      if (styles.transitionProperty && styles.transitionProperty !== 'none') {
        for (let i = 0; i < transDurations.length; i++) {
          const dur = transDurations[i] || 0
          const del = transDelays[i] || 0
          const prop = transProps[i] ? transProps[i].trim() : 'all'
          if (prop !== 'none' && dur + del > 0) {
            hasFiniteTransition = true
            break
          }
        }
      }

      // If Web Animations API is available, also check getAnimations
      if (typeof el.getAnimations === 'function') {
        const anims = el.getAnimations()
        const finiteAnims = anims.filter(a => {
          const effect = a.effect
          if (effect && 'getTiming' in effect) {
            const timing = effect.getTiming()
            const duration = typeof timing.duration === 'number' ? timing.duration : 0
            const delay = typeof timing.delay === 'number' ? timing.delay : 0
            const iterations = typeof timing.iterations === 'number' ? timing.iterations : 1
            return iterations !== Infinity && (duration + delay) > 0
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
        hasFiniteAnimation = false
        hasFiniteTransition = false
      }

      const hasFiniteGsap = !prefersReducedMotion && finiteGsapTweens(el).length > 0

      if (!hasFiniteAnimation && !hasFiniteTransition && !hasFiniteGsap) {
        if (coordinator && coordinator.isCoordinatorActive()) {
          isOwnAnimationDoneRef.current = true
          coordinator.reportPartFinished(presenceId)
          setState('unmountSuspended')
          return
        }
        setState('unmounted')
        if (parentPresence) {
          parentPresence.onDescendantExitComplete(presenceId)
        }
        return
      }

      // Suspend unmount while transitions/animations/GSAP tweens complete
      setState('unmountSuspended')
    }
  }, [present, presenceId, parentPresence, coordinator])

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
        setState('unmounted')
        if (parentPresence) {
          parentPresence.onDescendantExitComplete(presenceId)
        }
      }
    })
  }, [coordinator, parentPresence, presenceId])

  // Register with parent presence on mount
  React.useEffect(() => {
    if (parentPresence) {
      parentPresence.registerDescendant(presenceId)
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

    let isCompleted = false

    const handleExitComplete = () => {
      if (prevPresentRef.current || stateRef.current !== 'unmountSuspended') {
        return
      }
      isOwnAnimationDoneRef.current = true
      if (isCompleted) return
      if (pendingDescendantsRef.current.size > 0) {
        // Wait for descendants to finish
        return
      }
      if (coordinator && coordinator.isCoordinatorActive()) {
        coordinator.reportPartFinished(presenceId)
        return
      }
      isCompleted = true
      setState('unmounted')
      if (parentPresence) {
        parentPresence.onDescendantExitComplete(presenceId)
      }
    }

    const onAnimationEnd = (event: AnimationEvent) => {
      if (event.target === el) {
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
      gsapCancelled = true
      el.removeEventListener('animationend', onAnimationEnd)
      el.removeEventListener('animationcancel', onAnimationCancel)
      el.removeEventListener('transitionend', onTransitionEnd)
      el.removeEventListener('transitioncancel', onTransitionCancel)
      clearTimeout(fallbackTimer)
    }
  }, [state, presenceId, parentPresence])

  const contextValue = React.useMemo<PresenceContextValue>(() => {
    return {
      registerDescendant: (id: string) => {
        pendingDescendantsRef.current.add(id)
      },
      unregisterDescendant: (id: string) => {
        pendingDescendantsRef.current.delete(id)
        if (
          state === 'unmountSuspended' &&
          isOwnAnimationDoneRef.current &&
          pendingDescendantsRef.current.size === 0
        ) {
          setState('unmounted')
          if (parentPresence) {
            parentPresence.onDescendantExitComplete(presenceId)
          }
        }
      },
      onDescendantExitComplete: (id: string) => {
        pendingDescendantsRef.current.delete(id)
        if (
          state === 'unmountSuspended' &&
          isOwnAnimationDoneRef.current &&
          pendingDescendantsRef.current.size === 0
        ) {
          setState('unmounted')
          if (parentPresence) {
            parentPresence.onDescendantExitComplete(presenceId)
          }
        }
      },
    }
  }, [state, presenceId, parentPresence])

  const isPresent = state === 'mounted' || state === 'unmountSuspended'

  return {
    isPresent,
    ref: refCallback,
    contextValue,
  }
}

export function Presence({ children, present }: PresenceProps) {
  const { isPresent, ref, contextValue } = usePresence(present)

  if (!isPresent || !children) {
    return null
  }

  // Reject text or non-element children if present
  if (typeof children !== 'object' || !React.isValidElement(children)) {
    throw new Error(
      'Reference UI: Presence expects a single valid React element child.'
    )
  }

  // Compose the child's ref with Presence internal observer ref
  const child = children as React.ReactElement<any>
  const originalRef = (child.props as any)?.ref

  const composedRef = (node: HTMLElement | null) => {
    ref(node)
    if (typeof originalRef === 'function') {
      originalRef(node)
    } else if (originalRef && typeof originalRef === 'object' && 'current' in originalRef) {
      ;(originalRef as React.MutableRefObject<HTMLElement | null>).current = node
    }
  }

  return (
    <PresenceContext.Provider value={contextValue}>
      {React.cloneElement(child, {
        ref: composedRef,
      })}
    </PresenceContext.Provider>
  )
}
