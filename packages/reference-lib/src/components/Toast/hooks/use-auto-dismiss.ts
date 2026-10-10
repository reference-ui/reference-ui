/**
 * Toast auto-dismiss hook: arms the countdown that dismisses a timed
 * toast and pauses it while anything holds — hover-expand, focus, hidden
 * tab, isolating overlay, drag, or exit. Banks elapsed time on every
 * pause and cleanup so only visible time burns the budget; explicit
 * duration changes restart the budget while content-only updates keep
 * it. Returns whether the timer currently holds for the paused marker.
 */
import * as React from 'react'
import { useStore } from 'zustand'
import { overlayStackStore } from '../../Overlay/stack'
import {
  isToastItemPaused,
  isToastPausedByOverlay,
  LIBRARY_TOAST_DURATION,
  remainingAfterElapsed,
  shouldAutoDismiss,
  type ToastItemPauseFlags,
} from '../toastQueue'
import type { ToastDismissReason } from '../types'

export function useAutoDismiss({
  id,
  exiting,
  duration: durationProp,
  initialRemaining,
  paused: pausedExceptHidden,
  onDismiss,
}: {
  id: string
  exiting: boolean | undefined
  duration: number | false | undefined
  initialRemaining: number | false | undefined
  paused: Omit<ToastItemPauseFlags, 'hidden' | 'overlay'>
  onDismiss: (id: string, reason: ToastDismissReason) => void
}): { paused: boolean } {
  const duration = durationProp ?? LIBRARY_TOAST_DURATION
  const prevDurationRef = React.useRef(duration)
  const [remainingTime, setRemainingTime] = React.useState<number | false>(
    initialRemaining ?? duration
  )
  const lastResumeTime = React.useRef<number | null>(null)
  const [isHidden, setIsHidden] = React.useState(
    () => (typeof document !== 'undefined' ? document.visibilityState === 'hidden' : false)
  )
  const ownerDoc = typeof document !== 'undefined' ? document : null
  const isolatingOverlay = useStore(overlayStackStore, s =>
    isToastPausedByOverlay(s.layers, ownerDoc)
  )

  React.useEffect(() => {
    if (duration !== prevDurationRef.current) {
      prevDurationRef.current = duration
      durationResetRef.current = true
      setRemainingTime(duration)
    }
  }, [duration])

  React.useEffect(() => {
    const onVisibilityChange = () => setIsHidden(document.visibilityState === 'hidden')
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  const durationResetRef = React.useRef(false)

  const isPaused = isToastItemPaused({
    ...pausedExceptHidden,
    hidden: isHidden,
    overlay: isolatingOverlay,
  })

  React.useEffect(() => {
    if (exiting) return
    if (remainingTime === false) return

    if (isPaused) {
      if (lastResumeTime.current !== null) {
        const elapsed = Date.now() - lastResumeTime.current
        if (!durationResetRef.current) {
          setRemainingTime(prev => remainingAfterElapsed(prev, elapsed) as number | false)
        }
        durationResetRef.current = false
        lastResumeTime.current = null
      }
      return
    }

    if (shouldAutoDismiss(remainingTime)) {
      onDismiss(id, 'auto')
      return
    }

    durationResetRef.current = false
    lastResumeTime.current = Date.now()
    const timer = setTimeout(() => {
      onDismiss(id, 'auto')
    }, remainingTime)

    return () => {
      clearTimeout(timer)
      if (lastResumeTime.current !== null) {
        const elapsed = Date.now() - lastResumeTime.current
        if (!durationResetRef.current) {
          setRemainingTime(prev => remainingAfterElapsed(prev, elapsed) as number | false)
        }
        durationResetRef.current = false
        lastResumeTime.current = null
      }
    }
  }, [isPaused, remainingTime, id, exiting, onDismiss])

  return { paused: isPaused }
}
