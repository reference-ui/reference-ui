/** Hover-pointer policy for Popover `openOnHover`. Geometry lives in safe-polygon. */

export const DEFAULT_OPEN_DELAY = 700
export const DEFAULT_CLOSE_DELAY = 300
export const IMPATIENT_CLICK_MS = 300

export function isHoverCapablePointer(event: {
  pointerType: string
  pressure?: number
}): boolean {
  if (event.pointerType === 'touch') return false
  if (event.pointerType === 'mouse' || event.pointerType === '') return true
  if (event.pointerType === 'pen') return (event.pressure ?? 0) === 0
  return false
}
