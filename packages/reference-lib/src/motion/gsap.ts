import type { gsap as GSAPStatic } from 'gsap'
import gsapPkg from 'gsap'

export const gsap: typeof GSAPStatic = (gsapPkg as any)?.gsap ?? (gsapPkg as any)?.default ?? gsapPkg

export const COLLAPSE_DURATION = 0.32

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function finiteGsapTweens(element: HTMLElement) {
  return gsap.getTweensOf(element).filter((tween: gsap.core.Tween) => {
    const duration = tween.duration()
    const delay = typeof tween.delay === 'function' ? tween.delay() : 0
    if (duration + delay <= 0) return false
    if (typeof tween.paused === 'function' && tween.paused()) return false
    return tween.progress() < 1
  })
}


export function collapseDuration(): number {
  return prefersReducedMotion() ? 0 : COLLAPSE_DURATION
}
