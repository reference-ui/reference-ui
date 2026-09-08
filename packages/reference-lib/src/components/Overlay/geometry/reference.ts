import type { OverlayAnchor, OverlayEdge } from '../types'
import type { ReferenceType, VirtualAnchor } from './floating'

export function resolveReference(
  anchor: OverlayAnchor,
  trigger: HTMLElement | null,
  isolationFocus: boolean,
  edge?: OverlayEdge
): ReferenceType | null {
  if (edge) return null

  if (anchor) {
    if (typeof anchor === 'object' && 'current' in anchor) {
      return anchor.current
    }
    if (typeof HTMLElement !== 'undefined' && anchor instanceof HTMLElement) {
      return anchor
    }
    if (typeof anchor === 'object' && 'getBoundingClientRect' in anchor) {
      return anchor as VirtualAnchor
    }
    if (typeof anchor === 'object' && 'x' in anchor && 'y' in anchor) {
      const point = anchor as { x: number; y: number; width?: number; height?: number }
      return {
        getBoundingClientRect: () =>
          new DOMRect(point.x, point.y, point.width ?? 0, point.height ?? 0),
      }
    }
  }

  // Isolating dialogs keep Trigger as opener only. Popover/menu use it as the reference.
  if (trigger && !isolationFocus) {
    return (trigger.closest('[data-reference-field]') as HTMLElement | null) ?? trigger
  }

  return null
}
