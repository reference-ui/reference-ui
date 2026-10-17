/**
 * Menu pointer capability and submenu geometry reads: hover-capable
 * detection (touch never hovers, pen hovers only untouched) and the
 * content-side read backing default placement and intent math. Pure
 * over event fields and attributes; unit-tested.
 */
import type { Side as IntentSide } from '../../Overlay/geometry/floating'

export function hoverCapablePointer(pointerType: string, pressure = 0): boolean {
  if (pointerType === 'touch') return false
  if (pointerType === 'mouse' || pointerType === '') return true
  if (pointerType === 'pen') return pressure === 0
  return false
}

export function submenuSide(content: HTMLElement | null, fallback: IntentSide): IntentSide {
  const side = content?.getAttribute('data-side')?.split('-')[0]
  if (side === 'top' || side === 'right' || side === 'bottom' || side === 'left') return side
  return fallback
}
