/**
 * Finite-exit verdicts over style snapshots: whether a closing animation
 * or transition is worth suspending the unmount for. Takes the before/after
 * computed snapshots; newly finite effects hold, everything else releases.
 */
import { parseDuration } from './duration'

/**
 * Pure verdicts over computed CSS exit effects. Given a snapshot of the
 * closing child's `animation-*` / `transition-*` longhands (plus the previous
 * animation name, so preexisting ambient animations don't masquerade as
 * exits), `hasFiniteExitAnimation` and `hasFiniteExitTransition` report
 * whether any declared effect actually runs — finite iterations, a non-`none`
 * name/property, and positive delay-plus-duration. `detect.ts` snapshots the
 * live element; these functions decide, so they test without a browser.
 */

export interface ExitAnimationSnapshot {
  animationName: string
  animationDuration: string
  animationDelay: string
  animationIterationCount: string
}

export interface ExitTransitionSnapshot {
  transitionProperty: string
  transitionDuration: string
  transitionDelay: string
}

export function hasFiniteExitAnimation(
  snapshot: ExitAnimationSnapshot,
  prevAnimationName: string
): boolean {
  const currentAnimationName = snapshot.animationName || 'none'
  const isAnimationChanged =
    currentAnimationName !== 'none' && currentAnimationName !== prevAnimationName
  if (!isAnimationChanged) return false

  const animDurations = (snapshot.animationDuration || '').split(',').map(parseDuration)
  const animDelays = (snapshot.animationDelay || '').split(',').map(parseDuration)
  const animIterations = (snapshot.animationIterationCount || '').split(',')
  const animNames = currentAnimationName.split(',').map(s => s.trim())

  for (let i = 0; i < animNames.length; i++) {
    const dur = animDurations[i % animDurations.length] || 0
    const del = animDelays[i % animDelays.length] || 0
    const iter = animIterations[i % animIterations.length]?.trim() || '1'
    const name = animNames[i]
    if (name !== 'none' && iter !== 'infinite' && dur + del > 0) {
      return true
    }
  }
  return false
}

export function hasFiniteExitTransition(snapshot: ExitTransitionSnapshot): boolean {
  const transPropStr = snapshot.transitionProperty || 'none'
  if (transPropStr === 'none') return false

  const transProps = transPropStr.split(',').map(s => s.trim())
  const transDurations = (snapshot.transitionDuration || '').split(',').map(parseDuration)
  const transDelays = (snapshot.transitionDelay || '').split(',').map(parseDuration)

  for (let i = 0; i < transProps.length; i++) {
    const prop = transProps[i]
    const dur = transDurations[i % transDurations.length] || 0
    const del = transDelays[i % transDelays.length] || 0
    if (prop !== 'none' && dur + del > 0) {
      return true
    }
  }
  return false
}
