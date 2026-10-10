/**
 * `resolveSlotVisibility` collapses the `SlotVisibility` flags into one
 * verdict: omitted `visible` reads as true, `hidden: true` wins over
 * everything, and `visible: false` unmounts. The host decides what to
 * render from the verdict; hiding never unregisters, so state is kept.
 */
import type { ResolvedSlotVisibility, SlotVisibility } from '../types'

export function resolveSlotVisibility(visibility?: SlotVisibility): ResolvedSlotVisibility {
  if (!visibility) {
    return 'visible'
  }
  const isHidden = visibility.hidden === true
  const isVisible = visibility.visible !== false // omitted visible is true

  if (isHidden) {
    return 'hidden'
  }
  if (!isVisible) {
    return 'unmounted'
  }
  return 'visible'
}
