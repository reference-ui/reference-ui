import { getOverflowAncestors } from './clipping'
import { isEditableTarget } from '../shared/events'
import { observeMove } from './observe-move'
import {
  createDirtyPoll,
  isLayoutProperty,
  snapshotRects,
  type RectLike,
} from '../../../core/measure'
import type { ReferenceType } from './floating'

export interface AutoUpdateOptions {
  closeOnScroll?: boolean
  onScrollClose?: () => void
  animationFrame?: boolean
  boundary?: ReferenceType | null
}

function isElementReference(value: unknown): value is Element {
  return (
    typeof Element !== 'undefined' &&
    typeof value === 'object' &&
    value !== null &&
    'nodeType' in value &&
    (value as Node).nodeType === Node.ELEMENT_NODE
  )
}

function unwrapReference(reference: ReferenceType): Element | null {
  if (isElementReference(reference)) return reference
  const context = (reference as { contextElement?: Element }).contextElement
  return isElementReference(context) ? context : null
}

/**
 * Living position while anchored Overlay is open.
 *
 * Default path is event-driven: ancestor scroll/resize, visualViewport,
 * ResizeObserver, IntersectionObserver layout-shift. Zero rAF loop.
 *
 * `animationFrame` is an opt-in sleeping poll for transform-driven motion.
 * It does not ResizeObserver the reference (Floating UI), does not attach
 * window pointermove, and sleeps after idle frames.
 */
export function autoUpdate(
  reference: ReferenceType,
  floating: HTMLElement,
  update: () => void,
  options: AutoUpdateOptions = {}
): () => void {
  update()

  const win = floating.ownerDocument.defaultView ?? window
  const doc = floating.ownerDocument
  const referenceEl = unwrapReference(reference)
  const animationFrame = options.animationFrame === true
  const boundary = options.boundary ?? null

  const handleResize = () => update()
  const handleScroll = (event: Event) => {
    if (isEditableTarget(event.target)) return
    if (options.closeOnScroll) {
      options.onScrollClose?.()
    } else {
      update()
    }
  }

  win.addEventListener('resize', handleResize)

  const ancestorSet = new Set<Element | Window>()
  if (referenceEl) {
    for (const ancestor of getOverflowAncestors(referenceEl)) ancestorSet.add(ancestor)
  } else {
    ancestorSet.add(win)
  }
  for (const ancestor of getOverflowAncestors(floating)) ancestorSet.add(ancestor)
  const ancestors = Array.from(ancestorSet)
  ancestors.forEach(ancestor => ancestor.addEventListener('scroll', handleScroll, { passive: true }))

  const visualViewport = win.visualViewport
  visualViewport?.addEventListener('resize', handleResize)
  visualViewport?.addEventListener('scroll', handleResize)

  const cleanupMove =
    referenceEl && typeof IntersectionObserver === 'function'
      ? observeMove(referenceEl, update, true)
      : null

  let reobserveFrame = -1
  let resizeObserver: ResizeObserver | null = null

  if (typeof ResizeObserver === 'function') {
    resizeObserver = new ResizeObserver(entries => {
      const first = entries[0]
      if (first && first.target === referenceEl && resizeObserver) {
        resizeObserver.unobserve(floating)
        if (typeof cancelAnimationFrame === 'function') {
          cancelAnimationFrame(reobserveFrame)
        }
        if (typeof requestAnimationFrame === 'function') {
          reobserveFrame = requestAnimationFrame(() => {
            resizeObserver?.observe(floating)
          })
        } else {
          resizeObserver.observe(floating)
        }
      }
      update()
    })

    if (referenceEl && !animationFrame) {
      resizeObserver.observe(referenceEl)
    }
    resizeObserver.observe(floating)
    if (isElementReference(boundary)) {
      resizeObserver.observe(boundary)
    }
  }

  let stopPoll: (() => void) | null = null

  if (animationFrame) {
    const poll = createDirtyPoll({
      // Floating left/top writes must not keep the poll awake. RO owns floating size.
      measure: (): RectLike[] => snapshotRects([reference, boundary]),
      onChange: update,
      isHidden: () => doc.hidden,
    })

    const related = (target: EventTarget | null) => {
      if (!(target instanceof Node)) return false
      if (floating === target || floating.contains(target)) return true
      if (referenceEl && (referenceEl === target || referenceEl.contains(target) || target.contains(referenceEl))) {
        return true
      }
      if (isElementReference(boundary) && (boundary === target || boundary.contains(target) || target.contains(boundary))) {
        return true
      }
      return false
    }

    const wake = () => {
      if (doc.hidden) return
      poll.wake()
    }

    const handleVisibility = () => {
      if (!doc.hidden) wake()
    }

    const handleAnimationStart = (event: Event) => {
      if (related(event.target)) wake()
    }

    const handleTransitionStart = (event: Event) => {
      if (!related(event.target)) return
      if (event instanceof TransitionEvent) {
        if (typeof event.propertyName === 'string' && !isLayoutProperty(event.propertyName)) return
      }
      wake()
    }

    doc.addEventListener('visibilitychange', handleVisibility)
    doc.addEventListener('animationstart', handleAnimationStart, true)
    doc.addEventListener('transitionstart', handleTransitionStart, true)
    wake()

    stopPoll = () => {
      poll.stop()
      doc.removeEventListener('visibilitychange', handleVisibility)
      doc.removeEventListener('animationstart', handleAnimationStart, true)
      doc.removeEventListener('transitionstart', handleTransitionStart, true)
    }
  }

  return () => {
    stopPoll?.()
    cleanupMove?.()
    win.removeEventListener('resize', handleResize)
    ancestors.forEach(ancestor => ancestor.removeEventListener('scroll', handleScroll))
    visualViewport?.removeEventListener('resize', handleResize)
    visualViewport?.removeEventListener('scroll', handleResize)
    if (typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(reobserveFrame)
    }
    resizeObserver?.disconnect()
    resizeObserver = null
  }
}
