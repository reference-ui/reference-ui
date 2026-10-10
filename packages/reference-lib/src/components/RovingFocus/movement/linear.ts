/** One-dimensional arrow resolution for the RovingFocus kernel. Given a
 * key, orientation, direction, position, and loop flag, `resolveLinearTarget`
 * returns the destination index plus whether the key was handled — the
 * caller prevents default on handled keys even at a clamped boundary, and
 * moves focus only when the destination differs. Horizontal arrows reverse
 * under RTL; vertical arrows never consult direction; Home/End/PageUp/PageDown
 * are whole-composite endpoints in every orientation including grids. */

import type { RovingFocusOrientation } from '../types'

export interface LinearTargetOptions {
  key: string
  orientation: RovingFocusOrientation
  isRtl: boolean
  currentIndex: number
  /** Number of enabled items; destinations clamp or wrap within it. */
  count: number
  loop: boolean
}

export interface LinearTarget {
  /** Destination index; equals the current index at a clamped boundary. */
  targetIndex: number
  /** True when the key is a handled navigation key (caller prevents default). */
  handled: boolean
}

export function resolveLinearTarget(options: LinearTargetOptions): LinearTarget {
  const { key, orientation, isRtl, currentIndex, count, loop } = options
  let targetIndex = currentIndex
  let handled = false

  if (orientation === 'horizontal') {
    if ((!isRtl && key === 'ArrowRight') || (isRtl && key === 'ArrowLeft')) {
      handled = true
      targetIndex = currentIndex + 1
      if (targetIndex >= count) {
        targetIndex = loop ? 0 : count - 1
      }
    } else if ((!isRtl && key === 'ArrowLeft') || (isRtl && key === 'ArrowRight')) {
      handled = true
      targetIndex = currentIndex - 1
      if (targetIndex < 0) {
        targetIndex = loop ? count - 1 : 0
      }
    }
  }

  if (orientation === 'vertical') {
    if (key === 'ArrowDown') {
      handled = true
      targetIndex = currentIndex + 1
      if (targetIndex >= count) {
        targetIndex = loop ? 0 : count - 1
      }
    } else if (key === 'ArrowUp') {
      handled = true
      targetIndex = currentIndex - 1
      if (targetIndex < 0) {
        targetIndex = loop ? count - 1 : 0
      }
    }
  }

  if (key === 'Home' || key === 'PageUp') {
    handled = true
    targetIndex = 0
  } else if (key === 'End' || key === 'PageDown') {
    handled = true
    targetIndex = count - 1
  }

  return { targetIndex, handled }
}
