import { gsap, collapseDuration } from './gsap'

export interface CollapseAnimationOptions {
  open: boolean
  /** Skip the first enter so initially-open content does not play mount motion. */
  skip?: boolean
  onComplete?: () => void
}

/**
 * Height-collapse used by Collapsible (and Accordion through it).
 * Presence observes these tweens and holds the node until they finish.
 */
export function animateCollapse(
  element: HTMLElement,
  { open, skip = false, onComplete }: CollapseAnimationOptions
): gsap.core.Tween | null {
  gsap.killTweensOf(element)

  const duration = collapseDuration()

  if (skip || duration === 0) {
    gsap.set(element, {
      height: open ? 'auto' : 0,
      paddingTop: open ? '' : 0,
      paddingBottom: open ? '' : 0,
      overflow: open ? 'visible' : 'hidden',
      boxSizing: 'border-box',
    })
    onComplete?.()
    return null
  }

  if (open) {
    // 1. Temporarily clear inline styles so we can measure true open target dimensions
    const prevHeight = element.style.height
    const prevPaddingTop = element.style.paddingTop
    const prevPaddingBottom = element.style.paddingBottom

    element.style.height = 'auto'
    element.style.paddingTop = ''
    element.style.paddingBottom = ''
    element.style.overflow = 'hidden'
    element.style.boxSizing = 'border-box'

    const computed = window.getComputedStyle(element)
    const targetPaddingTop = computed.paddingTop
    const targetPaddingBottom = computed.paddingBottom
    const targetHeight = element.getBoundingClientRect().height

    // 2. Set starting position
    const startHeight = prevHeight && prevHeight !== '0px' && prevHeight !== '0' ? prevHeight : 0
    const startPaddingTop = prevPaddingTop || '0px'
    const startPaddingBottom = prevPaddingBottom || '0px'

    gsap.set(element, {
      height: startHeight,
      paddingTop: startPaddingTop,
      paddingBottom: startPaddingBottom,
      overflow: 'hidden',
      boxSizing: 'border-box',
    })

    // 3. Animate smoothly to exact numeric targetHeight and targetPadding
    return gsap.to(element, {
      height: targetHeight,
      paddingTop: targetPaddingTop,
      paddingBottom: targetPaddingBottom,
      overflow: 'hidden',
      duration,
      ease: 'power2.out',
      onComplete: () => {
        gsap.set(element, {
          height: 'auto',
          paddingTop: '',
          paddingBottom: '',
          overflow: 'visible',
        })
        onComplete?.()
      },
    })
  }


  return gsap.to(element, {
    height: 0,
    paddingTop: 0,
    paddingBottom: 0,
    overflow: 'hidden',
    duration,
    ease: 'power2.inOut',
    onComplete: () => {
      onComplete?.()
    },
  })
}

