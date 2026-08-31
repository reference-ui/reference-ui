import { gsap } from 'gsap'
import { collapseDuration } from './gsap'

export interface CollapseAnimationOptions {
  open: boolean
  /** Skip the first enter so initially-open content does not play mount motion. */
  skip?: boolean
}

/**
 * Height-collapse used by Collapsible (and Accordion through it).
 * Presence observes these tweens and holds the node until they finish.
 */
export function animateCollapse(
  element: HTMLElement,
  { open, skip = false }: CollapseAnimationOptions
): gsap.core.Tween | null {
  gsap.killTweensOf(element)

  const duration = collapseDuration()

  if (skip || duration === 0) {
    gsap.set(element, {
      height: open ? 'auto' : 0,
      overflow: open ? 'visible' : 'hidden',
      boxSizing: 'border-box',
    })
    return null
  }

  if (open) {
    return gsap.fromTo(
      element,
      { height: 0, overflow: 'hidden', boxSizing: 'border-box' },
      {
        height: 'auto',
        overflow: 'hidden',
        duration,
        ease: 'power2.out',
        onComplete: () => {
          gsap.set(element, { height: 'auto', overflow: 'visible' })
        },
      }
    )
  }

  return gsap.to(element, {
    height: 0,
    overflow: 'hidden',
    duration,
    ease: 'power2.inOut',
  })
}
