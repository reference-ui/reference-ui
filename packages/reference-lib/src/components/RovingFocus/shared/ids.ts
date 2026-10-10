/** Generated Item ids for the RovingFocus kernel. `nextRovingFocusItemId`
 * hands out monotonic `rf-item-N` identities for Items mounted without an
 * explicit `id`, so registration, currentness, and repair always have a
 * stable key. Module-scoped and never reset, matching the pre-refactor
 * counter exactly. */

let rovingFocusIdCounter = 0

export function nextRovingFocusItemId(): string {
  return `rf-item-${++rovingFocusIdCounter}`
}
