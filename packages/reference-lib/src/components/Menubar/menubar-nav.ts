// Pure menubar move computation. Trigger and content key handling share this
// so focus moves (RovingFocus) and value switches (Menubar) never disagree
// about direction, edges, or loop behavior. No React, no DOM; unit-tested.

export type MenubarDirection = 1 | -1

// Maps a horizontal arrow key to a move direction. Returns null for any other
// key. Mirrors RovingFocus horizontal handling (ArrowRight advances in LTR,
// retreats in RTL).
export function menubarArrowDirection(key: string, isRtl: boolean): MenubarDirection | null {
  if (key === 'ArrowRight') return isRtl ? -1 : 1
  if (key === 'ArrowLeft') return isRtl ? 1 : -1
  return null
}

// Resolves the menu value a Left/Right move lands on. `values` is the
// enabled menu values in DOM order. Returns the resolved value, which equals
// `current` at a clamped edge (caller skips the request), or null when there
// is nowhere to move. An unknown anchor (stale value, disabled-while-open)
// lands on the edge the motion heads toward.
export function adjacentMenubarValue(
  values: readonly string[],
  current: string | null,
  direction: MenubarDirection,
  loop: boolean
): string | null {
  const first = values[0]
  const last = values[values.length - 1]
  if (first === undefined || last === undefined) return null
  if (current === null) return direction > 0 ? first : last
  const index = values.indexOf(current)
  if (index === -1) return direction > 0 ? first : last
  const next = index + direction
  if (next < 0) return loop ? last : current
  if (next >= values.length) return loop ? first : current
  return values[next] ?? current
}
