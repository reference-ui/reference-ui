/**
 * Exit-effect detection: reads the closing frame — computed CSS animations
 * and transitions, Web Animations, finite GSAP tweens — and reduces them
 * to one instant-or-suspend verdict with the effects worth waiting for.
 */
import { finiteGsapTweens } from '../../../motion/gsap'
import {
  hasFiniteExitAnimation,
  hasFiniteExitTransition,
} from './effects'
import { hasActiveFiniteAnimations } from './animations'

/**
 * Exit-start effect detection for one closing child. `detectExitEffects`
 * snapshots the element's computed CSS exit effects and Web Animations, then
 * reports which drivers hold the exit: finite CSS animations, finite CSS
 * transitions, or finite GSAP tweens (gated off under reduced motion, since
 * `animateCollapse`-style drivers already collapse to zero there). WAAPI is
 * the tiebreak beneath the longhands — when animations exist but none are
 * finite and no transition runs, the CSS-animation verdict stands down. The
 * hook treats all-false as instant removal; anything true suspends the
 * unmount until `watch.ts` signals completion.
 */

export interface ExitEffects {
  hasFiniteAnimation: boolean
  hasFiniteTransition: boolean
  hasFiniteGsap: boolean
}

export function detectExitEffects(
  el: HTMLElement,
  prevAnimationName: string
): ExitEffects {
  const styles = window.getComputedStyle(el)

  let hasFiniteAnimation = hasFiniteExitAnimation(
    {
      animationName: styles.animationName || 'none',
      animationDuration: styles.animationDuration || '',
      animationDelay: styles.animationDelay || '',
      animationIterationCount: styles.animationIterationCount || '',
    },
    prevAnimationName
  )

  const hasFiniteTransition = hasFiniteExitTransition({
    transitionProperty: styles.transitionProperty || 'none',
    transitionDuration: styles.transitionDuration || '',
    transitionDelay: styles.transitionDelay || '',
  })

  if (typeof el.getAnimations === 'function') {
    const anims = el.getAnimations({ subtree: false })
    if (
      anims.length > 0 &&
      !hasActiveFiniteAnimations(anims) &&
      !hasFiniteTransition
    ) {
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

  return { hasFiniteAnimation, hasFiniteTransition, hasFiniteGsap }
}
