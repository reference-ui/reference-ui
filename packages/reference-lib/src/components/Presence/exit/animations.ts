/**
 * Web Animations API verdicts for exit detection and completion. WAAPI is the
 * ground truth beneath the CSS longhands: `isActiveFiniteAnimation` says
 * whether one animation still holds an exit (running, finite iterations,
 * positive delay-plus-duration), `hasActiveFiniteAnimations` scans a whole
 * `getAnimations()` list, and `isWaitableAnimation` reproduces the looser
 * filter the completion watcher uses when attaching `finished` promises
 * (finished-state and zero-duration animations are left to the event path).
 * Structurally typed so tests feed fakes instead of a browser.
 */

// Fields are `unknown` deliberately: only `typeof`-narrowed numbers are
// ever read, so wider DOM values (e.g. CSSNumericValue durations in
// current lib.dom) flow through safely instead of breaking assignability.
export interface WaapiTiming {
  duration?: unknown
  delay?: unknown
  iterations?: unknown
}

export interface WaapiAnimation {
  playState?: string
  effect?: { getTiming?: () => WaapiTiming } | null
}

function timingOf(animation: WaapiAnimation): WaapiTiming | null {
  const effect = animation.effect
  if (effect && 'getTiming' in effect && typeof effect.getTiming === 'function') {
    return effect.getTiming()
  }
  return null
}

export function isActiveFiniteAnimation(animation: WaapiAnimation): boolean {
  if (animation.playState === 'finished') return false
  const timing = timingOf(animation)
  if (!timing) return false
  if (timing.iterations === Infinity) return false
  const duration = typeof timing.duration === 'number' ? timing.duration : 0
  const delay = typeof timing.delay === 'number' ? timing.delay : 0
  return duration + delay > 0
}

export function hasActiveFiniteAnimations(animations: WaapiAnimation[]): boolean {
  return animations.some(isActiveFiniteAnimation)
}

export function isWaitableAnimation(animation: WaapiAnimation): boolean {
  const timing = timingOf(animation)
  return timing?.iterations !== Infinity
}
