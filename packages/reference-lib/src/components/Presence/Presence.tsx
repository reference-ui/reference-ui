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

      const hasFiniteGsap = finiteGsapTweens(el).length > 0

      if (!hasFiniteAnimation && !hasFiniteTransition && !hasFiniteGsap) {
        setState('unmounted')
        if (parentPresence) {
          parentPresence.onDescendantExitComplete(presenceId)
        }
        return
      }

      // Suspend unmount while transitions/animations/GSAP tweens complete
      setState('unmountSuspended')
    }
  }, [present, presenceId, parentPresence])

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
      isOwnAnimationDoneRef.current = true
      if (isCompleted) return
      if (pendingDescendantsRef.current.size > 0) {
        // Wait for descendants to finish
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
  const originalRef = (child as any).ref

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
