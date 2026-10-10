/**
 * Toast pointer-release detection: spots the buttonless mouse move that
 * Firefox emits when a drag leaves the window and drops the up event.
 * Pointer events carry their own pointerType; plain mouse events fall
 * back to the buttons bitmask. The swipe hook finishes from the last
 * applied offset instead of tracking the phantom position.
 */
export function isReleasedMouseMove(e: PointerEvent | MouseEvent): boolean {
  if ('pointerType' in e) return e.pointerType === 'mouse' && e.buttons === 0
  return e.buttons === 0
}
