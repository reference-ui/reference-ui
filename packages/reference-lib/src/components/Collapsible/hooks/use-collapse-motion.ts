/**
 * Collapse motion: the panel's measured height tween. Open sizes publish as
 * CSS variables (refreshed by a resize observer that yields to active
 * animation frames), and each open/close runs the collapse tween unless a
 * skip is armed — initial enter, one beforematch reveal, or an instant
 * hidden-until-found shut — while force-mount-alone content never tweens.
 */
import * as React from 'react'
import { animateCollapse } from '../../../motion/collapse'
import { gsap, finiteGsapTweens } from '../../../motion/gsap'
import { resolveCollapseSkip } from '../collapse/skip'

export interface CollapseMotionOptions {
  nodeRef: React.RefObject<HTMLDivElement | null>
  isOpen: boolean
  skipEnterRef: React.MutableRefObject<boolean>
  skipMotionOnceRef: React.MutableRefObject<boolean>
  untilFound: boolean
  forceMountAlone: boolean
}

export function useCollapseMotion({
  nodeRef,
  isOpen,
  skipEnterRef,
  skipMotionOnceRef,
  untilFound,
  forceMountAlone,
}: CollapseMotionOptions): void {
  const publish = React.useCallback(() => {
    const node = nodeRef.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    if (rect.height > 0) {
      node.style.setProperty('--reference-collapsible-content-height', `${rect.height}px`)
    }
    if (rect.width > 0) {
      node.style.setProperty('--reference-collapsible-content-width', `${rect.width}px`)
    }
  }, [])

  React.useLayoutEffect(() => {
    const node = nodeRef.current
    if (!node || !isOpen) return

    if (typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(() => {
      // Skip layout recalculation during active animation frames to avoid stutter
      if (finiteGsapTweens(node).length > 0) return
      publish()
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [isOpen, publish])

  React.useLayoutEffect(() => {
    const node = nodeRef.current
    if (!node) return

    const skipEnterArmed = skipEnterRef.current
    const skipOnceArmed = skipMotionOnceRef.current
    skipMotionOnceRef.current = false
    if (isOpen) skipEnterRef.current = false

    const { animate, skip } = resolveCollapseSkip({
      skipEnterArmed,
      skipOnceArmed,
      isOpen,
      untilFound,
      forceMountAlone,
    })
    if (!animate) return

    animateCollapse(node, {
      open: isOpen,
      skip,
      onComplete: () => {
        if (isOpen) publish()
      },
    })

    return () => {
      gsap.killTweensOf(node)
    }
  }, [isOpen, skipEnterRef, skipMotionOnceRef, untilFound, forceMountAlone, publish])
}
