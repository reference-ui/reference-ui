/**
 * Exit-completion watcher: subscribes every completion signal — animation
 * and transition events, Web Animations, GSAP — while the unmount hangs.
 * Takes the node and a settle callback; the guard picks the single winner.
 */
import { finiteGsapTweens } from '../../../motion/gsap'
import { isWaitableAnimation } from './animations'

/**
 * Suspended-exit completion watcher for one observed node. `watchExitCompletion`
 * subscribes to every signal that can end an exit — `animationend` /
 * `animationcancel` / `transitionend` / `transitioncancel` targeted at the
 * node itself (descendant events bubble past, never complete), WAAPI
 * `finished` promises, finite GSAP tween promises, and a 5s fallback timer —
 * and invokes `onSignal` for each. It holds `animationFillMode: forwards`
 * across the completion turn so the final frame cannot flash (PR-ANIMATION-02),
 * restoring the authored fill mode on a microtask. The returned cleanup
 * detaches everything; the caller owns the completion verdict, so stale
 * signals after re-present or unmount simply have no one left to convince.
 */

export function watchExitCompletion(
  el: HTMLElement,
  onSignal: () => void
): () => void {
  let isCancelled = false
  let fillModeTimeoutId: number | undefined

  const onAnimationEnd = (event: AnimationEvent) => {
    if (event.target === el) {
      // PR-ANIMATION-02: prevent final-frame flash by holding forwards fillMode
      const currentFillMode = el.style.animationFillMode
      el.style.animationFillMode = 'forwards'
      fillModeTimeoutId = window.setTimeout(() => {
        if (el.style.animationFillMode === 'forwards') {
          el.style.animationFillMode = currentFillMode
        }
      })
      onSignal()
    }
  }

  const onAnimationCancel = (event: AnimationEvent) => {
    if (event.target === el) {
      onSignal()
    }
  }

  const onTransitionEnd = (event: TransitionEvent) => {
    if (event.target === el) {
      onSignal()
    }
  }

  const onTransitionCancel = (event: TransitionEvent) => {
    if (event.target === el) {
      onSignal()
    }
  }

  el.addEventListener('animationend', onAnimationEnd)
  el.addEventListener('animationcancel', onAnimationCancel)
  el.addEventListener('transitionend', onTransitionEnd)
  el.addEventListener('transitioncancel', onTransitionCancel)

  if (typeof el.getAnimations === 'function') {
    const anims = el.getAnimations({ subtree: false }).filter(isWaitableAnimation)
    if (anims.length > 0) {
      Promise.allSettled(anims.map(a => a.finished)).then(() => {
        if (!isCancelled) {
          onSignal()
        }
      })
    }
  }

  let gsapCancelled = false
  const gsapTweens = finiteGsapTweens(el)
  if (gsapTweens.length > 0) {
    Promise.all(gsapTweens.map((tween: gsap.core.Tween) => tween.then())).then(() => {
      if (!gsapCancelled) onSignal()
    })
  }

  const fallbackTimer = setTimeout(() => {
    onSignal()
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
}
