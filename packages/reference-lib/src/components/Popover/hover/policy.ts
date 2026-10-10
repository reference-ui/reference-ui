/**
 * Hover-pointer policy for `openOnHover`: which pointers count as hover
 * (mouse, hovering pen, and legacy empty-type events — never touch), plus
 * the default open/close delays and the impatient-click window that swallows
 * the click landing right after a hover open. Geometry lives in
 * safe-polygon; this module answers only whether a pointer may drive hover.
 */

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
